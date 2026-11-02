import { publicationErrors } from "@/src/business/constants/modelPublication";
import { PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS } from "@/src/business/constants/modelPublicationEditor";
import { publicationIdSchema } from "@/src/business/schemas/modelPublication";
import type {
  PublicationEditorData,
  PublicationMetadata,
} from "@/src/business/types/modelPublication";
import type { PublicationEditorFiles } from "@/src/business/types/modelPublicationEditor";
import type {
  PublicationPreviewAuthor,
  PublicationPreviewSnapshot,
} from "@/src/business/types/modelPublicationPreview";
import {
  awaitPublicationRequest,
  getPublicationManifest,
} from "@/src/business/utils/modelPublication";
import {
  PublicationEditorRequestError,
  publicationEditorData,
} from "@/src/business/utils/modelPublicationEditor";
import { z } from "zod";

export const publicationPreviewAuthorSchema = z.object({
  id: publicationIdSchema,
  username: z.string().min(1),
  avatar_path: z.string().nullable(),
}) satisfies z.ZodType<PublicationPreviewAuthor>;

const authorResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(false), error: z.enum(publicationErrors) }),
  z.object({
    ok: z.literal(true),
    data: publicationPreviewAuthorSchema.extend({
      avatar_path: z
        .url()
        .refine((value) => /^https?:\/\//.test(value))
        .nullable(),
    }),
  }),
]);

export function publicationPreviewAuthor(
  value: unknown,
  ownerId: string,
): PublicationPreviewAuthor {
  const parsed = authorResultSchema.safeParse(value);
  if (!parsed.success) throw new PublicationEditorRequestError("generic");
  if (!parsed.data.ok)
    throw new PublicationEditorRequestError(parsed.data.error);
  if (parsed.data.data.id !== ownerId)
    throw new PublicationEditorRequestError("session_changed");
  return parsed.data.data;
}

export function publicationPreviewSnapshot(
  metadata: PublicationMetadata,
  files: PublicationEditorFiles,
  saved: PublicationEditorData | null,
): PublicationPreviewSnapshot {
  const source = files.source
    ? getPublicationManifest(files.source, "source")
    : saved?.source;
  return {
    metadata: { ...metadata },
    source: source
      ? {
          file_name: source.name,
          format: source.extension,
          file_size_bytes: source.size,
          is_primary: true,
        }
      : null,
    coverFile: files.cover,
    savedCover:
      !files.cover && saved?.cover
        ? { draftId: saved.draft.id, assetId: saved.cover.id }
        : null,
  };
}

export function publicationPreviewCover(
  value: unknown,
  ownerId: string,
  expected: NonNullable<PublicationPreviewSnapshot["savedCover"]>,
): string {
  const data = publicationEditorData(value, ownerId, expected.draftId);
  if (data.cover?.id !== expected.assetId || !data.coverUrl)
    throw new PublicationEditorRequestError("conflict");
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new PublicationEditorRequestError("generic");
  const url = new URL(data.coverUrl);
  if (
    url.origin !== new URL(base).origin ||
    decodeURIComponent(url.pathname) !==
      `/storage/v1/object/sign/model-draft-images/${ownerId}/${expected.draftId}/${expected.assetId}.${data.cover.extension}` ||
    !url.searchParams.get("token")
  )
    throw new PublicationEditorRequestError("storage_unavailable");
  return url.toString();
}

export async function awaitPublicationPreview<T>(
  request: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  const timer = setTimeout(abort, PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS);
  try {
    return await awaitPublicationRequest(request, controller.signal);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
