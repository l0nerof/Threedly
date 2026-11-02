import { modelManagementRevalidationPaths } from "@/src/business/constants/modelManagement";
import {
  PUBLICATION_COVER_URL_SECONDS,
  PUBLICATION_REQUEST_TIMEOUT_MS,
} from "@/src/business/constants/modelPublication";
import {
  publicationIdSchema,
  publicationRpcSchema,
} from "@/src/business/schemas/modelPublication";
import type { Database } from "@/src/business/types/database.generated";
import type {
  PublicationAsset,
  PublicationContext,
  PublicationFailure,
  PublicationMutation,
  PublicationResult,
} from "@/src/business/types/modelPublication";
import {
  awaitPublicationRequest,
  isPublicationAssetPath,
  isPublicationCleanupPath,
} from "@/src/business/utils/modelPublication";
import { createClient } from "@/src/business/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

type RpcArgs =
  Database["public"]["Functions"]["manage_publication_draft"]["Args"];

export async function withPublicationClient<T>(
  operation: (context: PublicationContext) => Promise<PublicationResult<T>>,
): Promise<PublicationResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    PUBLICATION_REQUEST_TIMEOUT_MS,
  );
  let context: PublicationContext | undefined;
  try {
    const client = await awaitPublicationRequest(
      createClient(),
      controller.signal,
    );
    const auth = await awaitPublicationRequest(
      client.auth.getUser(),
      controller.signal,
    );
    if (auth.error)
      return {
        ok: false,
        error: [400, 401, 403].includes(auth.error.status ?? 0)
          ? "unauthorized"
          : "generic",
      };
    const identity = publicationIdSchema.safeParse(auth.data.user?.id);
    if (!identity.success) return { ok: false, error: "unauthorized" };
    context = {
      client,
      userId: identity.data,
      signal: controller.signal,
      writeAttempted: false,
    };
    return await operation(context);
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      error: controller.signal.aborted ? "timeout" : "generic",
    };
  } finally {
    clearTimeout(timer);
    if (context?.writeAttempted) {
      for (const path of modelManagementRevalidationPaths)
        revalidatePath(path, "page");
    }
  }
}

export async function managePublication(
  context: PublicationContext,
  args: RpcArgs,
): Promise<PublicationMutation> {
  context.signal.throwIfAborted();
  context.writeAttempted = true;
  const response = await awaitPublicationRequest(
    context.client
      .rpc("manage_publication_draft", args)
      .abortSignal(context.signal)
      .single(),
    context.signal,
  );
  if (response.error) return { ok: false, error: "generic" };
  const row = publicationRpcSchema.safeParse(response.data);
  if (!row.success || row.data.draft_id !== args.requested_draft_id)
    return { ok: false, error: "generic" };
  if (row.data.result !== "ok") return { ok: false, error: row.data.result };
  if (
    !row.data.assets.every((asset) =>
      isPublicationAssetPath(
        asset,
        context.userId,
        row.data.draft_id,
        row.data.model_id,
      ),
    ) ||
    !row.data.objects.every((object) =>
      isPublicationCleanupPath(
        object,
        context.userId,
        row.data.draft_id,
        row.data.model_id,
      ),
    ) ||
    new Set(row.data.assets.map((asset) => asset.id)).size !==
      row.data.assets.length ||
    new Set(row.data.objects.map((object) => object.bucket + "/" + object.path))
      .size !== row.data.objects.length
  ) {
    return { ok: false, error: "storage_unavailable" };
  }
  return { ok: true, data: row.data };
}

export async function cleanPublicationFiles(
  context: PublicationContext,
  draftId: string,
): Promise<PublicationMutation> {
  const pending = await managePublication(context, {
    requested_draft_id: draftId,
    requested_operation: "cleanup",
  });
  if (!pending.ok) return pending;
  for (const bucket of [
    "model-draft-files",
    "model-draft-images",
    "models",
    "model-images",
  ] as const) {
    const paths = pending.data.objects
      .filter((object) => object.bucket === bucket)
      .map((object) => object.path);
    if (!paths.length) continue;
    context.signal.throwIfAborted();
    const removed = await awaitPublicationRequest(
      context.client.storage.from(bucket).remove(paths),
      context.signal,
    );
    if (removed.error) return { ok: false, error: "cleanup_incomplete" };
  }
  return managePublication(context, {
    requested_draft_id: draftId,
    requested_operation: "finish_cleanup",
  });
}

export async function copyPublicationFiles(
  context: PublicationContext,
  assets: readonly PublicationAsset[],
): Promise<PublicationFailure | null> {
  if (
    assets.length !== 2 ||
    new Set(assets.map((asset) => asset.kind)).size !== 2
  )
    return { ok: false, error: "storage_unavailable" };
  for (const asset of assets) {
    if (
      !asset.destinationBucket ||
      !asset.destinationPath ||
      asset.state !== "active"
    )
      return { ok: false, error: "storage_unavailable" };
    context.signal.throwIfAborted();
    const copied = await awaitPublicationRequest(
      context.client.storage
        .from(asset.bucket)
        .copy(asset.path, asset.destinationPath, {
          destinationBucket: asset.destinationBucket,
        }),
      context.signal,
    );
    if (
      copied.error &&
      String(copied.error.statusCode) !== "409" &&
      copied.error.message !== "The resource already exists"
    ) {
      return { ok: false, error: "storage_unavailable" };
    }
  }
  return null;
}

export async function signPublicationCover(
  context: PublicationContext,
  asset: PublicationAsset,
): Promise<PublicationResult<string>> {
  context.signal.throwIfAborted();
  const signed = await awaitPublicationRequest(
    context.client.storage
      .from(asset.bucket)
      .createSignedUrl(asset.path, PUBLICATION_COVER_URL_SECONDS),
    context.signal,
  );
  if (signed.error || !signed.data?.signedUrl)
    return { ok: false, error: "file_unavailable" };
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return { ok: false, error: "generic" };
  const url = new URL(signed.data.signedUrl);
  const expected = new URL(base);
  if (
    url.origin !== expected.origin ||
    decodeURIComponent(url.pathname) !==
      "/storage/v1/object/sign/" + asset.bucket + "/" + asset.path ||
    !url.searchParams.get("token")
  )
    return { ok: false, error: "storage_unavailable" };
  return { ok: true, data: url.toString() };
}
