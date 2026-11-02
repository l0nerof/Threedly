"use server";

import {
  MODEL_MANAGEMENT_TIMEOUT_MS,
  modelManagementRevalidationPaths,
} from "@/src/business/constants/modelManagement";
import {
  MODEL_IMAGE_UPLOAD_BUCKET,
  MODEL_UPLOAD_BUCKET,
} from "@/src/business/constants/modelUpload";
import { UPLOADS_PAGE_SIZE } from "@/src/business/constants/profileConfig";
import {
  modelManagementDeleteSchema,
  modelManagementIdSchema,
  modelManagementPublicationSchema,
  modelManagementRpcRowSchema,
  modelManagementUpdateSchema,
  ownedModelRequestSchema,
  ownedModelRowSchema,
  ownedModelsCategoryGroupsSchema,
  ownedModelsCountSchema,
  ownedModelsProfileSchema,
  ownedModelsRequestSchema,
  ownedModelsRowsSchema,
} from "@/src/business/schemas/modelManagement";
import type { Database } from "@/src/business/types/database.generated";
import type {
  ModelManagementFailure,
  ModelManagementResult,
  ModelManagementRpcRow,
  OwnedModelReadResult,
  OwnedModelsPageResult,
} from "@/src/business/types/modelManagement";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import {
  awaitModelManagementRequest,
  isOwnedModelStoragePath,
} from "@/src/business/utils/modelManagement";
import { createClient } from "@/src/business/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

type Context = {
  client: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  signal: AbortSignal;
  writeAttempted: boolean;
};
type RpcArgs = Database["public"]["Functions"]["manage_owned_model"]["Args"];

async function withClient<T>(
  operation: (context: Context) => Promise<T>,
): Promise<T | ModelManagementFailure> {
  const controller = new AbortController();
  const { signal } = controller;
  const timer = setTimeout(
    () => controller.abort(),
    MODEL_MANAGEMENT_TIMEOUT_MS,
  );
  let context: Context | undefined;
  try {
    const client = await awaitModelManagementRequest(createClient(), signal);
    const {
      data: { user },
      error,
    } = await awaitModelManagementRequest(client.auth.getUser(), signal);
    if (error)
      return {
        ok: false,
        error: [400, 401, 403].includes(error.status ?? 0)
          ? "unauthorized"
          : "generic",
      };
    if (!user) return { ok: false, error: "unauthorized" };
    const identity = modelManagementIdSchema.safeParse(user.id);
    if (!identity.success) return { ok: false, error: "generic" };
    context = { client, userId: identity.data, signal, writeAttempted: false };
    return await operation(context);
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: signal.aborted ? "timeout" : "generic" };
  } finally {
    clearTimeout(timer);
    if (context?.writeAttempted) {
      for (const path of modelManagementRevalidationPaths)
        revalidatePath(path, "page");
    }
  }
}

export async function fetchOwnedModelsPageAction(
  input: unknown = {},
): Promise<OwnedModelsPageResult> {
  const request = ownedModelsRequestSchema.safeParse(input);
  if (!request.success) return { ok: false, error: "invalid_request" };
  return withClient<OwnedModelsPageResult>(
    async ({ client, userId, signal }) => {
      const [profileResult, categoriesResult] = await Promise.all([
        awaitModelManagementRequest(
          client
            .from("profiles")
            .select("id, can_upload")
            .eq("id", userId)
            .abortSignal(signal)
            .maybeSingle(),
          signal,
        ),
        awaitModelManagementRequest(
          client
            .from("category_groups")
            .select(
              "id, slug, name_ua, name_en, sort_order, categories(id, slug, name_ua, name_en, sort_order, is_featured)",
            )
            .order("sort_order", { ascending: true })
            .abortSignal(signal),
          signal,
        ),
      ]);
      const profile = ownedModelsProfileSchema.safeParse(profileResult.data);
      if (profileResult.error || !profile.success || profile.data.id !== userId)
        return { ok: false, error: "generic" };
      const categories = ownedModelsCategoryGroupsSchema.safeParse(
        categoriesResult.data,
      );
      const categoryGroups =
        !categoriesResult.error && categories.success ? categories.data : null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const counted = await awaitModelManagementRequest(
          client
            .from("models")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", userId)
            .abortSignal(signal),
          signal,
        );
        const count = ownedModelsCountSchema.safeParse(counted.count);
        if (counted.error || !count.success)
          return { ok: false, error: "generic" };
        const totalPages = Math.max(
          1,
          Math.ceil(count.data / UPLOADS_PAGE_SIZE),
        );
        const currentPage = Math.min(request.data.page, totalPages);
        const from = (currentPage - 1) * UPLOADS_PAGE_SIZE;
        const listed =
          count.data === 0
            ? { data: [], error: null }
            : await awaitModelManagementRequest(
                client
                  .from("models")
                  .select(
                    "id, creator_id, title_ua, title_en, status, deletion_pending, file_format, file_size_bytes, created_at, updated_at",
                  )
                  .eq("creator_id", userId)
                  .order("created_at", { ascending: false })
                  .order("id", { ascending: true })
                  .range(from, from + UPLOADS_PAGE_SIZE - 1)
                  .abortSignal(signal),
                signal,
              );
        const models = ownedModelsRowsSchema.safeParse(listed.data);
        if (
          listed.error ||
          !models.success ||
          models.data.some((model) => model.creator_id !== userId)
        )
          return { ok: false, error: "generic" };
        if (
          models.data.length !== Math.min(UPLOADS_PAGE_SIZE, count.data - from)
        )
          continue;
        return {
          ok: true,
          page: {
            profileId: userId,
            canUpload: profile.data.can_upload,
            models: models.data,
            currentPage,
            totalPages,
            totalCount: count.data,
            categoryGroups,
          },
        };
      }
      return { ok: false, error: "generic" };
    },
  );
}

async function manage(
  context: Context,
  args: RpcArgs,
): Promise<ModelManagementRpcRow | ModelManagementFailure> {
  context.signal.throwIfAborted();
  context.writeAttempted = true;
  const response = await awaitModelManagementRequest(
    context.client
      .rpc("manage_owned_model", args)
      .abortSignal(context.signal)
      .single(),
    context.signal,
  );
  if (response.error) return { ok: false, error: "generic" };
  const parsed = modelManagementRpcRowSchema.safeParse(response.data);
  if (!parsed.success || parsed.data.model_id !== args.requested_model_id)
    return { ok: false, error: "generic" };
  const row = parsed.data;
  if (row.result !== "ok") return { ok: false, error: row.result };
  if (
    args.requested_operation !== "begin_delete" &&
    (row.model_paths.length || row.image_paths.length)
  )
    return { ok: false, error: "generic" };
  if (
    ![...row.model_paths, ...row.image_paths].every((path) =>
      isOwnedModelStoragePath(path, context.userId, args.requested_model_id),
    )
  )
    return { ok: false, error: "storage_unavailable" };
  return row;
}

export async function fetchOwnedModelAction(
  input: unknown,
): Promise<OwnedModelReadResult> {
  const parsed = ownedModelRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_request" };
  return withClient<OwnedModelReadResult>(
    async ({ client, userId, signal }) => {
      const response = await awaitModelManagementRequest(
        client
          .from("models")
          .select(
            "id, creator_id, slug, category_id, title_ua, title_en, description_ua, description_en, minimum_plan, status, deletion_pending",
          )
          .eq("id", parsed.data.modelId)
          .eq("creator_id", userId)
          .abortSignal(signal)
          .maybeSingle(),
        signal,
      );
      if (response.error) return { ok: false, error: "generic" };
      if (!response.data) return { ok: false, error: "model_unavailable" };
      const model = ownedModelRowSchema.safeParse(response.data);
      if (
        !model.success ||
        model.data.id !== parsed.data.modelId ||
        model.data.creator_id !== userId
      )
        return { ok: false, error: "generic" };
      return { ok: true, model: model.data };
    },
  );
}

export async function updateOwnedModelAction(
  locale: string,
  input: unknown,
): Promise<ModelManagementResult> {
  const parsed = modelManagementUpdateSchema.safeParse(input);
  if (!isLocaleCode(locale) || !parsed.success)
    return { ok: false, error: "invalid_request" };
  return withClient<ModelManagementResult>(async (context) => {
    const result = await manage(context, {
      requested_model_id: parsed.data.modelId,
      requested_operation: "update",
      requested_metadata: parsed.data.metadata,
    });
    return "ok" in result ? result : { ok: true, modelId: parsed.data.modelId };
  });
}

export async function setOwnedModelPublicationAction(
  locale: string,
  input: unknown,
): Promise<ModelManagementResult> {
  const parsed = modelManagementPublicationSchema.safeParse(input);
  if (!isLocaleCode(locale) || !parsed.success)
    return { ok: false, error: "invalid_request" };
  return withClient<ModelManagementResult>(async (context) => {
    const result = await manage(context, {
      requested_model_id: parsed.data.modelId,
      requested_operation:
        parsed.data.status === "published" ? "publish" : "archive",
    });
    return "ok" in result ? result : { ok: true, modelId: parsed.data.modelId };
  });
}

export async function deleteOwnedModelAction(
  locale: string,
  input: unknown,
): Promise<ModelManagementResult> {
  const parsed = modelManagementDeleteSchema.safeParse(input);
  if (!isLocaleCode(locale) || !parsed.success)
    return { ok: false, error: "invalid_request" };
  return withClient<ModelManagementResult>(async (context) => {
    const args = { requested_model_id: parsed.data.modelId };
    const pending = await manage(context, {
      ...args,
      requested_operation: "begin_delete",
    });
    if ("ok" in pending) return pending;
    for (const [bucket, paths] of [
      [MODEL_UPLOAD_BUCKET, pending.model_paths],
      [MODEL_IMAGE_UPLOAD_BUCKET, pending.image_paths],
    ] as const) {
      if (!paths.length) continue;
      context.signal.throwIfAborted();
      const response = await awaitModelManagementRequest(
        context.client.storage.from(bucket).remove(paths),
        context.signal,
      );
      if (response.error) return { ok: false, error: "cleanup_incomplete" };
    }
    const completed = await manage(context, {
      ...args,
      requested_operation: "finish_delete",
    });
    return "ok" in completed
      ? completed
      : { ok: true, modelId: parsed.data.modelId };
  });
}
