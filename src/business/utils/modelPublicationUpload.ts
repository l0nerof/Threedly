import { PUBLICATION_UPLOAD_TIMEOUT_MS } from "@/src/business/constants/modelPublication";
import {
  publicationIdSchema,
  publicationRevisionSchema,
  publicationRpcSchema,
} from "@/src/business/schemas/modelPublication";
import type {
  PublicationManifest,
  PublicationMutation,
} from "@/src/business/types/modelPublication";
import {
  awaitPublicationRequest,
  getPublicationManifest,
  isPublicationAssetPath,
} from "@/src/business/utils/modelPublication";
import { createClient } from "@/src/business/utils/supabase/client";

type UploadPublicationInput = {
  userId: string;
  draftId: string;
  revision: number;
  kind: "source" | "cover";
  file: File;
  signal?: AbortSignal;
  reserve: (input: {
    draftId: string;
    revision: number;
    file: PublicationManifest;
  }) => Promise<PublicationMutation>;
  attach: (input: {
    draftId: string;
    revision: number;
    assetId: string;
  }) => Promise<PublicationMutation>;
};

export async function uploadPublicationAsset(
  input: UploadPublicationInput,
): Promise<PublicationMutation> {
  const identity = publicationIdSchema.safeParse(input.userId);
  const draftId = publicationIdSchema.safeParse(input.draftId);
  const revision = publicationRevisionSchema.safeParse(input.revision);
  const manifest = getPublicationManifest(input.file, input.kind);
  if (!identity.success || !draftId.success || !revision.success || !manifest)
    return { ok: false, error: "invalid_request" };
  if (input.signal?.aborted) return { ok: false, error: "timeout" };
  const controller = new AbortController();
  const abort = () => controller.abort();
  input.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, PUBLICATION_UPLOAD_TIMEOUT_MS);
  try {
    const client = createClient();
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
    if (!auth.data.user) return { ok: false, error: "unauthorized" };
    if (auth.data.user.id !== identity.data)
      return { ok: false, error: "session_changed" };
    const reservation = await awaitPublicationRequest(
      input.reserve({
        draftId: draftId.data,
        revision: revision.data,
        file: manifest,
      }),
      controller.signal,
    );
    if (!reservation.ok) return reservation;
    const row = publicationRpcSchema.safeParse(reservation.data);
    if (
      !row.success ||
      row.data.result !== "ok" ||
      row.data.draft_id !== draftId.data ||
      row.data.revision !== revision.data ||
      row.data.lifecycle !== "draft" ||
      row.data.model_id !== null ||
      row.data.assets.length !== 1
    )
      return { ok: false, error: "storage_unavailable" };
    const asset = row.data.assets[0];
    if (
      asset.state !== "reserved" ||
      !isPublicationAssetPath(asset, identity.data, draftId.data, null) ||
      asset.name !== manifest.name ||
      asset.kind !== manifest.kind ||
      asset.extension !== manifest.extension ||
      asset.mimeType !== manifest.mimeType ||
      asset.size !== manifest.size
    )
      return { ok: false, error: "storage_unavailable" };
    controller.signal.throwIfAborted();
    const uploaded = await awaitPublicationRequest(
      client.storage.from(asset.bucket).upload(asset.path, input.file, {
        upsert: false,
        contentType: manifest.mimeType,
        cacheControl: "0",
      }),
      controller.signal,
    );
    if (uploaded.error) return { ok: false, error: "storage_unavailable" };
    const current = await awaitPublicationRequest(
      client.auth.getUser(),
      controller.signal,
    );
    if (current.error)
      return {
        ok: false,
        error: [400, 401, 403].includes(current.error.status ?? 0)
          ? "session_changed"
          : "generic",
      };
    if (current.data.user?.id !== identity.data)
      return { ok: false, error: "session_changed" };
    const attached = await awaitPublicationRequest(
      input.attach({
        draftId: draftId.data,
        revision: revision.data,
        assetId: asset.id,
      }),
      controller.signal,
    );
    if (!attached.ok) return attached;
    const confirmed = publicationRpcSchema.safeParse(attached.data);
    if (
      !confirmed.success ||
      confirmed.data.result !== "ok" ||
      confirmed.data.draft_id !== draftId.data ||
      confirmed.data.revision !== revision.data + 1 ||
      confirmed.data.lifecycle !== "draft" ||
      confirmed.data.model_id !== null ||
      confirmed.data.assets.length ||
      confirmed.data.objects.length
    ) {
      return { ok: false, error: "generic" };
    }
    return { ok: true, data: confirmed.data };
  } catch {
    return {
      ok: false,
      error: controller.signal.aborted ? "timeout" : "generic",
    };
  } finally {
    clearTimeout(timer);
    input.signal?.removeEventListener("abort", abort);
  }
}
