"use server";

import { marketplacePlanKeys } from "@/src/business/constants/plans";
import {
  modelDownloadFileSchema,
  modelDownloadModelSchema,
  modelDownloadProfileSchema,
  modelDownloadRequestSchema,
  modelDownloadSignedUrlSchema,
} from "@/src/business/schemas/modelDownload";
import { Constants } from "@/src/business/types/database.generated";
import type { ModelDownloadActionResult } from "@/src/business/types/modelDownload";
import { buildModelUploadStoragePath } from "@/src/business/utils/modelUpload";
import { createAdminClient } from "@/src/business/utils/supabase/admin";
import { createClient } from "@/src/business/utils/supabase/server";
import { z } from "zod";

const DOWNLOAD_REQUEST_TIMEOUT_MS = 10_000;
const DOWNLOAD_URL_EXPIRY_SECONDS = 60;
const downloadStatusSchema = z.enum(
  Constants.public.Enums.model_download_status,
);

async function awaitDownloadRequest<T>(
  request: PromiseLike<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let rejectOnAbort = () => {};

  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => {
        rejectOnAbort = () => reject(signal.reason);
        signal.addEventListener("abort", rejectOnAbort, { once: true });
      }),
    ]);
  } finally {
    signal.removeEventListener("abort", rejectOnAbort);
  }
}

export async function downloadModelAction(
  input: unknown,
): Promise<ModelDownloadActionResult> {
  const request = modelDownloadRequestSchema.safeParse(input);
  if (!request.success) {
    return { ok: false, error: "invalidRequest" };
  }

  const controller = new AbortController();
  const { signal } = controller;
  const timeout = setTimeout(
    () => controller.abort(),
    DOWNLOAD_REQUEST_TIMEOUT_MS,
  );

  try {
    const supabase = await awaitDownloadRequest(createClient(), signal);
    const {
      data: { user },
      error: userError,
    } = await awaitDownloadRequest(supabase.auth.getUser(), signal);

    if (userError) {
      return {
        ok: false,
        error:
          userError.status === 400 ||
          userError.status === 401 ||
          userError.status === 403
            ? "unauthorized"
            : "generic",
      };
    }
    if (!user) {
      return { ok: false, error: "unauthorized" };
    }

    const { data: profileData, error: profileError } =
      await awaitDownloadRequest(
        supabase
          .from("profiles")
          .select("id, plan_key")
          .eq("id", user.id)
          .abortSignal(signal)
          .maybeSingle(),
        signal,
      );
    if (profileError) {
      return { ok: false, error: "generic" };
    }
    const profile = modelDownloadProfileSchema.safeParse(profileData);
    if (!profile.success || profile.data.id !== user.id) {
      return { ok: false, error: "unauthorized" };
    }

    const { data: modelData, error: modelError } = await awaitDownloadRequest(
      supabase
        .from("models")
        .select("id, creator_id, minimum_plan, status")
        .eq("id", request.data.modelId)
        .eq("status", "published")
        .abortSignal(signal)
        .maybeSingle(),
      signal,
    );
    if (modelError) {
      return { ok: false, error: "generic" };
    }
    const model = modelDownloadModelSchema.safeParse(modelData);
    if (!model.success || model.data.id !== request.data.modelId) {
      return { ok: false, error: "model_unavailable" };
    }
    if (
      marketplacePlanKeys.indexOf(profile.data.plan_key) <
      marketplacePlanKeys.indexOf(model.data.minimum_plan)
    ) {
      return { ok: false, error: "plan_required" };
    }

    const admin = createAdminClient(signal);
    let fileQuery = admin
      .from("model_files")
      .select("id, model_id, storage_provider, bucket, object_path, file_name")
      .eq("model_id", model.data.id);

    if (request.data.fileId) {
      fileQuery = fileQuery.eq("id", request.data.fileId);
    }

    const { data: fileData, error: fileError } = await awaitDownloadRequest(
      fileQuery
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(1)
        .abortSignal(signal)
        .maybeSingle(),
      signal,
    );
    if (fileError) {
      return { ok: false, error: "generic" };
    }
    const file = modelDownloadFileSchema.safeParse(fileData);
    if (
      !file.success ||
      file.data.model_id !== model.data.id ||
      (request.data.fileId && file.data.id !== request.data.fileId) ||
      !model.data.creator_id ||
      file.data.object_path !==
        buildModelUploadStoragePath({
          userId: model.data.creator_id,
          modelId: model.data.id,
          fileName: file.data.file_name,
        })
    ) {
      return { ok: false, error: "file_unavailable" };
    }

    const { data: signedData, error: signingError } =
      await awaitDownloadRequest(
        admin.storage
          .from(file.data.bucket)
          .createSignedUrl(file.data.object_path, DOWNLOAD_URL_EXPIRY_SECONDS, {
            download: true,
          }),
        signal,
      );
    if (signingError) {
      return {
        ok: false,
        error:
          signingError.status === 404 || signingError.statusCode === "404"
            ? "file_unavailable"
            : "storageUnavailable",
      };
    }

    const signed = modelDownloadSignedUrlSchema.safeParse(signedData);
    if (!signed.success) {
      return { ok: false, error: "storageUnavailable" };
    }
    const url = new URL(signed.data.signedUrl);
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    if (
      url.origin !== supabaseUrl.origin ||
      url.pathname !==
        `${supabaseUrl.pathname.replace(/\/$/, "")}/storage/v1/object/sign/${file.data.bucket}/${file.data.object_path}` ||
      !url.searchParams.get("token") ||
      url.username ||
      url.password ||
      url.hash
    ) {
      return { ok: false, error: "storageUnavailable" };
    }
    url.searchParams.set("download", file.data.file_name);

    const { data: statusData, error: recordingError } =
      await awaitDownloadRequest(
        supabase
          .rpc("record_model_download", {
            requested_model_id: model.data.id,
            requested_file_id: file.data.id,
          })
          .abortSignal(signal),
        signal,
      );
    if (recordingError) {
      return { ok: false, error: "generic" };
    }
    const status = downloadStatusSchema.safeParse(statusData);
    if (!status.success) {
      return { ok: false, error: "generic" };
    }
    if (status.data !== "ok") {
      return { ok: false, error: status.data };
    }

    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false, error: signal.aborted ? "timeout" : "generic" };
  } finally {
    clearTimeout(timeout);
  }
}
