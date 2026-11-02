import {
  publicationErrors,
  publicationOperations,
} from "@/src/business/constants/modelPublication";
import {
  MAX_MODEL_COVER_IMAGE_SIZE_BYTES,
  MAX_MODEL_UPLOAD_FILE_SIZE_BYTES,
  modelUploadExtensions,
} from "@/src/business/constants/modelUpload";
import { Constants } from "@/src/business/types/database.generated";
import { z } from "zod";

export const publicationIdSchema = z
  .guid()
  .transform((value) => value.toLowerCase());
export const publicationRevisionSchema = z
  .number()
  .int()
  .min(0)
  .max(2147483646);
export const publicationMetadataSchema = z
  .object({
    titleUa: z.string().max(90),
    titleEn: z.string().max(90),
    descriptionUa: z.string().max(600).nullable(),
    descriptionEn: z.string().max(600).nullable(),
    categoryId: publicationIdSchema.nullable(),
    minimumPlan: z.enum(Constants.public.Enums.plan_key),
  })
  .strict();
export const publicationIdRequestSchema = z
  .object({ draftId: publicationIdSchema })
  .strict();
export const publicationRevisionRequestSchema =
  publicationIdRequestSchema.extend({ revision: publicationRevisionSchema });
export const publicationSaveSchema = publicationRevisionRequestSchema.extend({
  metadata: publicationMetadataSchema,
});
export const publicationManifestSchema = z
  .object({
    kind: z.enum(["source", "cover"]),
    name: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .refine((value) => !/[/\\\x00-\x1f\x7f]/.test(value)),
    extension: z.string(),
    mimeType: z.string(),
    size: z.number().int().min(1).max(MAX_MODEL_UPLOAD_FILE_SIZE_BYTES),
  })
  .strict()
  .refine((value) =>
    value.kind === "source"
      ? modelUploadExtensions.some((ext) => ext === value.extension) &&
        value.name.toLowerCase().endsWith("." + value.extension) &&
        value.mimeType === "application/octet-stream"
      : value.size <= MAX_MODEL_COVER_IMAGE_SIZE_BYTES &&
        ((value.extension === "jpg" && value.mimeType === "image/jpeg") ||
          (value.extension === "png" && value.mimeType === "image/png") ||
          (value.extension === "webp" && value.mimeType === "image/webp")),
  );
export const publicationReserveSchema = publicationRevisionRequestSchema.extend(
  { file: publicationManifestSchema },
);
export const publicationAttachSchema = publicationRevisionRequestSchema.extend({
  assetId: publicationIdSchema,
});
export const publicationDeleteSchema = publicationRevisionRequestSchema.extend({
  confirmed: z.literal(true),
});
export const publicationAssetSchema = publicationManifestSchema.safeExtend({
  id: publicationIdSchema,
  draftId: publicationIdSchema,
  bucket: z.enum(["model-draft-files", "model-draft-images"]),
  path: z.string().min(1).max(255),
  state: z.enum(Constants.public.Enums.publication_asset_state),
  destinationBucket: z.enum(["models", "model-images"]).nullable(),
  destinationPath: z.string().min(1).max(255).nullable(),
});
export const publicationObjectSchema = z
  .object({
    bucket: z.enum([
      "model-draft-files",
      "model-draft-images",
      "models",
      "model-images",
    ]),
    path: z.string().min(1).max(255),
  })
  .strict();
export const publicationRpcSchema = z
  .object({
    result: z.enum(["ok", ...publicationErrors]),
    draft_id: publicationIdSchema,
    revision: publicationRevisionSchema.nullable(),
    lifecycle: z
      .enum(Constants.public.Enums.publication_draft_state)
      .nullable(),
    model_id: publicationIdSchema.nullable(),
    assets: z.array(publicationAssetSchema).max(2),
    objects: z.array(publicationObjectSchema).max(102),
  })
  .refine(
    (value) =>
      value.result === "ok" || (!value.assets.length && !value.objects.length),
  )
  .refine(
    (value) =>
      value.result !== "ok" ||
      ((value.lifecycle === null) === (value.revision === null) &&
        (value.lifecycle !== "draft" || value.model_id === null) &&
        (!["publishing", "published", "cancelling"].includes(
          value.lifecycle ?? "",
        ) ||
          value.model_id !== null)),
  );
export const publicationDraftRowSchema = z.object({
  id: publicationIdSchema,
  creator_id: publicationIdSchema,
  title_ua: z.string().max(90),
  title_en: z.string().max(90),
  description_ua: z.string().max(600).nullable(),
  description_en: z.string().max(600).nullable(),
  category_id: publicationIdSchema.nullable(),
  minimum_plan: z.enum(Constants.public.Enums.plan_key),
  revision: publicationRevisionSchema,
  lifecycle: z.enum(Constants.public.Enums.publication_draft_state),
  publication_model_id: publicationIdSchema.nullable(),
  source_asset_id: publicationIdSchema.nullable(),
  cover_asset_id: publicationIdSchema.nullable(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});
export const publicationEditorDraftSchema = publicationDraftRowSchema.omit({
  source_asset_id: true,
  cover_asset_id: true,
});
export const publicationStoredAssetSchema = z.object({
  id: publicationIdSchema,
  draft_id: publicationIdSchema,
  kind: z.enum(Constants.public.Enums.publication_asset_kind),
  object_path: z.string().min(1).max(255),
  file_name: z.string().min(1).max(255),
  extension: z.string(),
  mime_type: z.string(),
  byte_size: z.number().int().min(1).max(MAX_MODEL_UPLOAD_FILE_SIZE_BYTES),
  state: z.enum(Constants.public.Enums.publication_asset_state),
});
export const publicationPageSchema = z
  .object({
    page: z.number().int().min(1).max(2147483647).default(1),
  })
  .strict();
export const publicationRpcOperationSchema = z.enum(publicationOperations);
