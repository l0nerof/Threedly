import {
  MODEL_MANAGEMENT_CLEANUP_BATCH_SIZE,
  modelManagementErrorCodes,
  modelManagementRpcResults,
} from "@/src/business/constants/modelManagement";
import { UPLOADS_PAGE_SIZE } from "@/src/business/constants/profileConfig";
import { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
import type { CategoryGroupRow } from "@/src/business/types/category";
import { Constants } from "@/src/business/types/database.generated";
import type { Database, Tables } from "@/src/business/types/database.generated";
import { z } from "zod";

export const modelManagementIdSchema = z
  .guid()
  .transform((id) => id.toLowerCase());
const descriptionSchema = z
  .string()
  .trim()
  .max(600)
  .nullable()
  .transform((value) => value || null);

export const modelManagementMetadataSchema = modelUploadMetadataSchema
  .extend({
    descriptionUa: descriptionSchema,
    descriptionEn: descriptionSchema,
    categoryId: modelManagementIdSchema,
  })
  .strict();

export const ownedModelRequestSchema = z
  .object({ modelId: modelManagementIdSchema })
  .strict();
export const modelManagementUpdateSchema = ownedModelRequestSchema.extend({
  metadata: modelManagementMetadataSchema,
});
export const modelManagementPublicationSchema = ownedModelRequestSchema.extend({
  status: z.enum(["published", "archived"]),
});
export const modelManagementDeleteSchema = ownedModelRequestSchema.extend({
  confirmed: z.literal(true),
});

export const ownedModelRowSchema = z
  .object({
    id: modelManagementIdSchema,
    creator_id: modelManagementIdSchema,
    slug: z.string().min(1),
    category_id: modelManagementIdSchema,
    title_ua: z.string(),
    title_en: z.string(),
    description_ua: z.string().nullable(),
    description_en: z.string().nullable(),
    minimum_plan: z.enum(Constants.public.Enums.plan_key),
    status: z.enum(Constants.public.Enums.model_status),
    deletion_pending: z.boolean(),
  })
  .refine(
    (model) => !model.deletion_pending || model.status === "archived",
  ) satisfies z.ZodType<
  Pick<
    Tables<"models">,
    | "id"
    | "creator_id"
    | "slug"
    | "category_id"
    | "title_ua"
    | "title_en"
    | "description_ua"
    | "description_en"
    | "minimum_plan"
    | "status"
    | "deletion_pending"
  >
>;

const pathsSchema = z
  .array(z.string().min(1).max(255))
  .max(MODEL_MANAGEMENT_CLEANUP_BATCH_SIZE)
  .refine((paths) => new Set(paths).size === paths.length);

export const modelManagementRpcRowSchema = z
  .object({
    result: z.enum(modelManagementRpcResults),
    model_id: modelManagementIdSchema,
    model_paths: pathsSchema,
    image_paths: pathsSchema,
  })
  .refine(
    (row) =>
      row.result === "ok" ||
      (!row.model_paths.length && !row.image_paths.length),
  ) satisfies z.ZodType<
  Database["public"]["Functions"]["manage_owned_model"]["Returns"][number]
>;

export const modelManagementFailureSchema = z.object({
  ok: z.literal(false),
  error: z.enum(modelManagementErrorCodes),
});
export const modelManagementResultSchema = z.union([
  z.object({ ok: z.literal(true), modelId: modelManagementIdSchema }),
  modelManagementFailureSchema,
]);
export const ownedModelReadResultSchema = z.union([
  z.object({ ok: z.literal(true), model: ownedModelRowSchema }),
  modelManagementFailureSchema,
]);
export const ownedModelsRequestSchema = z.object({
  page: z
    .preprocess((value) => {
      if (typeof value === "string" && /^\d+$/.test(value))
        return Number(value);
      return value;
    }, z.number().int().min(1).max(2147483647).catch(1))
    .default(1),
});
export const ownedModelsCountSchema = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER);
export const ownedModelsProfileSchema = z.object({
  id: modelManagementIdSchema,
  can_upload: z.boolean(),
}) satisfies z.ZodType<Pick<Tables<"profiles">, "id" | "can_upload">>;
export const ownedModelsRowSchema = z
  .object({
    id: modelManagementIdSchema,
    creator_id: modelManagementIdSchema,
    title_ua: z.string(),
    title_en: z.string(),
    status: z.enum(Constants.public.Enums.model_status),
    deletion_pending: z.boolean(),
    file_format: z.string().nullable(),
    file_size_bytes: ownedModelsCountSchema.nullable(),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
  })
  .refine(
    (model) => !model.deletion_pending || model.status === "archived",
  ) satisfies z.ZodType<
  Pick<
    Tables<"models">,
    | "id"
    | "creator_id"
    | "title_ua"
    | "title_en"
    | "status"
    | "deletion_pending"
    | "file_format"
    | "file_size_bytes"
    | "created_at"
    | "updated_at"
  >
>;
export const ownedModelsRowsSchema = z
  .array(ownedModelsRowSchema)
  .max(UPLOADS_PAGE_SIZE)
  .refine((rows) => new Set(rows.map((row) => row.id)).size === rows.length);
export const ownedModelsCategoryGroupsSchema = z
  .array(
    z.object({
      id: modelManagementIdSchema,
      slug: z.string(),
      name_ua: z.string(),
      name_en: z.string(),
      sort_order: z.number().int(),
      categories: z
        .array(
          z.object({
            id: modelManagementIdSchema,
            slug: z.string(),
            name_ua: z.string(),
            name_en: z.string(),
            sort_order: z.number().int(),
            is_featured: z.boolean(),
          }),
        )
        .max(999)
        .nullable(),
    }),
  )
  .max(999) satisfies z.ZodType<CategoryGroupRow[]>;
