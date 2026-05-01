import { catalogPlanKeys } from "@/src/business/constants/catalogConfig";
import {
  MAX_MODEL_COVER_IMAGE_SIZE_BYTES,
  MAX_MODEL_UPLOAD_FILE_SIZE_BYTES,
} from "@/src/business/constants/modelUpload";
import {
  getModelCoverImageExtension,
  getModelPreviewFileExtension,
  getModelUploadFileExtension,
} from "@/src/business/utils/modelUpload";
import { z } from "zod";

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

const requiredUploadFileSchema = (message: string) =>
  z.custom<File>((value) => isFile(value) && value.size > 0, message);

const optionalDescriptionSchema = z
  .preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(600, "errors.descriptionTooLong"),
  )
  .transform((value) => (value.length > 0 ? value : null));

const modelFileSchema = requiredUploadFileSchema("errors.invalidFile")
  .refine(
    (file) => file.size <= MAX_MODEL_UPLOAD_FILE_SIZE_BYTES,
    "errors.fileTooLarge",
  )
  .refine(
    (file) => Boolean(getModelUploadFileExtension(file.name)),
    "errors.unsupportedFileType",
  );

const coverImageSchema = requiredUploadFileSchema("errors.invalidCoverImage")
  .refine(
    (file) => file.size <= MAX_MODEL_COVER_IMAGE_SIZE_BYTES,
    "errors.coverImageTooLarge",
  )
  .refine(
    (file) => Boolean(getModelCoverImageExtension(file.type)),
    "errors.unsupportedCoverImageType",
  );

const previewModelFileSchema = z
  .preprocess(
    (value) => (isFile(value) && value.size > 0 ? value : null),
    z.union([z.custom<File>(isFile), z.null()]),
  )
  .superRefine((file, context) => {
    if (!file) {
      return;
    }

    if (file.size > MAX_MODEL_UPLOAD_FILE_SIZE_BYTES) {
      context.addIssue({
        code: "custom",
        message: "errors.previewFileTooLarge",
      });
    }

    if (!getModelPreviewFileExtension(file.name)) {
      context.addIssue({
        code: "custom",
        message: "errors.unsupportedPreviewFileType",
      });
    }
  });

export const modelUploadMetadataSchema = z.object({
  titleUa: z
    .string("errors.titleRequired")
    .trim()
    .min(2, "errors.titleRequired")
    .max(90, "errors.titleTooLong"),
  titleEn: z
    .string("errors.titleRequired")
    .trim()
    .min(2, "errors.titleRequired")
    .max(90, "errors.titleTooLong"),
  descriptionUa: optionalDescriptionSchema,
  descriptionEn: optionalDescriptionSchema,
  categoryId: z
    .string("errors.categoryRequired")
    .guid("errors.categoryRequired"),
  minimumPlan: z.enum(catalogPlanKeys, "errors.minimumPlanRequired"),
});

export const modelUploadFormSchema = modelUploadMetadataSchema.extend({
  modelFile: modelFileSchema,
  coverImage: coverImageSchema,
  previewModelFile: previewModelFileSchema,
});
