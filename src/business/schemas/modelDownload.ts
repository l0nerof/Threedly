import {
  MODEL_UPLOAD_BUCKET,
  MODEL_UPLOAD_STORAGE_PROVIDER,
} from "@/src/business/constants/modelUpload";
import { marketplacePlanKeys } from "@/src/business/constants/plans";
import type { Tables } from "@/src/business/types/database.generated";
import { z } from "zod";

export const modelDownloadRequestSchema = z
  .object({
    modelId: z.string().guid(),
    fileId: z.string().guid().optional(),
  })
  .strict();

export const modelDownloadProfileSchema = z.object({
  id: z.string().guid(),
  plan_key: z.enum(marketplacePlanKeys),
}) satisfies z.ZodType<Pick<Tables<"profiles">, "id" | "plan_key">>;

export const modelDownloadModelSchema = z.object({
  id: z.string().guid(),
  creator_id: z.string().guid().nullable(),
  minimum_plan: z.enum(marketplacePlanKeys),
  status: z.literal("published"),
}) satisfies z.ZodType<
  Pick<Tables<"models">, "id" | "creator_id" | "minimum_plan" | "status">
>;

export const modelDownloadFileSchema = z.object({
  id: z.string().guid(),
  model_id: z.string().guid(),
  storage_provider: z.literal(MODEL_UPLOAD_STORAGE_PROVIDER),
  bucket: z.literal(MODEL_UPLOAD_BUCKET),
  object_path: z.string().min(1),
  file_name: z
    .string()
    .min(1)
    .regex(/^[^\p{Cc}/\\]+$/u),
}) satisfies z.ZodType<
  Pick<
    Tables<"model_files">,
    | "id"
    | "model_id"
    | "storage_provider"
    | "bucket"
    | "object_path"
    | "file_name"
  >
>;

export const modelDownloadSignedUrlSchema = z.object({
  signedUrl: z.string().url(),
});

export const modelFileSummarySchema = z.object({
  id: z.string().guid(),
  file_name: modelDownloadFileSchema.shape.file_name,
  format: z.string().min(1),
  file_size_bytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  is_primary: z.boolean(),
}) satisfies z.ZodType<
  Pick<
    Tables<"model_files">,
    "id" | "file_name" | "format" | "file_size_bytes" | "is_primary"
  >
>;
