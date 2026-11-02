import { publicationErrors } from "@/src/business/constants/modelPublication";
import { publicationReadinessFields } from "@/src/business/constants/modelPublicationEditor";
import {
  publicationEditorDraftSchema,
  publicationIdSchema,
  publicationMetadataSchema,
  publicationRpcSchema,
} from "@/src/business/schemas/modelPublication";
import type { CategoryGroupOption } from "@/src/business/types/category";
import type {
  PublicationEditorData,
  PublicationMetadata,
} from "@/src/business/types/modelPublication";
import type {
  PublicationEditorError,
  PublicationEditorFiles,
} from "@/src/business/types/modelPublicationEditor";
import { getPublicationManifest } from "@/src/business/utils/modelPublication";
import { z } from "zod";

const summary = z.object({
  id: publicationIdSchema,
  kind: z.enum(["source", "cover"]),
  name: z.string().min(1).max(255),
  size: z.number().int().positive(),
  extension: z.string().min(1),
});
const editorResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(false), error: z.enum(publicationErrors) }),
  z.object({
    ok: z.literal(true),
    data: z.object({
      draft: publicationEditorDraftSchema,
      source: summary.nullable(),
      cover: summary.nullable(),
      coverUrl: z.url().nullable(),
      cleanupPending: z.boolean(),
    }),
  }),
]);

export class PublicationEditorRequestError extends Error {
  constructor(public readonly code: PublicationEditorError) {
    super(code);
  }
}
export function publicationMetadata(
  data: PublicationEditorData | null,
): PublicationMetadata {
  return data
    ? {
        titleUa: data.draft.title_ua,
        titleEn: data.draft.title_en,
        descriptionUa: data.draft.description_ua,
        descriptionEn: data.draft.description_en,
        categoryId: data.draft.category_id,
        minimumPlan: data.draft.minimum_plan,
      }
    : {
        titleUa: "",
        titleEn: "",
        descriptionUa: null,
        descriptionEn: null,
        categoryId: null,
        minimumPlan: "free",
      };
}
export function samePublicationMetadata(
  a: PublicationMetadata,
  b: PublicationMetadata,
) {
  return (
    a.titleUa === b.titleUa &&
    a.titleEn === b.titleEn &&
    (a.descriptionUa ?? "") === (b.descriptionUa ?? "") &&
    (a.descriptionEn ?? "") === (b.descriptionEn ?? "") &&
    a.categoryId === b.categoryId &&
    a.minimumPlan === b.minimumPlan
  );
}
export function publicationReadiness(
  metadata: PublicationMetadata,
  files: PublicationEditorFiles,
  saved: PublicationEditorData | null,
  groups: CategoryGroupOption[] | null,
) {
  const validation = publicationMetadataSchema.safeParse(metadata);
  const invalidFields = new Set(
    validation.success
      ? []
      : validation.error.issues.map((issue) => issue.path[0]),
  );
  const complete = {
    titleUa:
      !invalidFields.has("titleUa") && metadata.titleUa.trim().length >= 2,
    titleEn:
      !invalidFields.has("titleEn") && metadata.titleEn.trim().length >= 2,
    category:
      !invalidFields.has("categoryId") &&
      groups?.some((group) =>
        group.categories.some(
          (category) => category.id === metadata.categoryId,
        ),
      ) === true,
    source: files.source
      ? !!getPublicationManifest(files.source, "source")
      : !!saved?.source,
    cover: files.cover
      ? !!getPublicationManifest(files.cover, "cover")
      : !!saved?.cover,
  };
  const items = publicationReadinessFields.map((key) => ({
    key,
    isComplete: complete[key],
  }));
  const completed = items.filter((item) => item.isComplete).length;
  return {
    items,
    completed,
    total: items.length,
    metadataValid: validation.success,
    ready: validation.success && completed === items.length,
  };
}
export function publicationReady(
  metadata: PublicationMetadata,
  files: PublicationEditorFiles,
  saved: PublicationEditorData | null,
  groups: CategoryGroupOption[] | null,
) {
  return publicationReadiness(metadata, files, saved, groups).ready;
}
export function publicationEditorData(
  value: unknown,
  ownerId: string,
  draftId: string,
): PublicationEditorData {
  const parsed = editorResultSchema.safeParse(value);
  if (!parsed.success) throw new PublicationEditorRequestError("generic");
  if (!parsed.data.ok)
    throw new PublicationEditorRequestError(parsed.data.error);
  const data = parsed.data.data;
  if (
    data.draft.creator_id !== ownerId ||
    data.draft.id !== draftId ||
    (data.source !== null && data.source.kind !== "source") ||
    (data.cover !== null && data.cover.kind !== "cover") ||
    (data.cover === null) !== (data.coverUrl === null)
  )
    throw new PublicationEditorRequestError("generic");
  return data;
}
export function publicationMutationData(value: unknown, draftId: string) {
  const result = z
    .discriminatedUnion("ok", [
      z.object({ ok: z.literal(false), error: z.enum(publicationErrors) }),
      z.object({ ok: z.literal(true), data: publicationRpcSchema }),
    ])
    .safeParse(value);
  if (!result.success) throw new PublicationEditorRequestError("generic");
  if (!result.data.ok)
    throw new PublicationEditorRequestError(result.data.error);
  if (result.data.data.draft_id !== draftId)
    throw new PublicationEditorRequestError("generic");
  if (result.data.data.result !== "ok")
    throw new PublicationEditorRequestError(result.data.data.result);
  return result.data.data;
}
export function publicationPageNumber(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 2147483647 ? page : 1;
}
