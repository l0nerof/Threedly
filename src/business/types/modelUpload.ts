import type {
  modelCoverImageMimeTypeExtensions,
  modelPreviewExtensions,
  modelUploadExtensions,
} from "@/src/business/constants/modelUpload";
import type { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
import type { z } from "zod";

export type ModelUploadExtension = (typeof modelUploadExtensions)[number];

export type ModelPreviewExtension = (typeof modelPreviewExtensions)[number];

export type ModelCoverImageMimeType =
  keyof typeof modelCoverImageMimeTypeExtensions;

export type ModelCoverImageExtension =
  (typeof modelCoverImageMimeTypeExtensions)[ModelCoverImageMimeType];

export type ModelUploadMetadataValues = z.infer<
  typeof modelUploadMetadataSchema
>;

export type ModelUploadActionError =
  | "invalidLocale"
  | "invalidMetadata"
  | "invalidFile"
  | "invalidCoverImage"
  | "fileTooLarge"
  | "coverImageTooLarge"
  | "previewFileTooLarge"
  | "unsupportedFileType"
  | "unsupportedCoverImageType"
  | "unsupportedPreviewFileType"
  | "unauthorized"
  | "uploadFailed"
  | "metadataSaveFailed"
  | "generic";

export type ModelUploadActionResult =
  | {
      ok: true;
      modelId: string;
    }
  | {
      ok: false;
      error: ModelUploadActionError;
    };

export type ModelUploadFormFieldName =
  | "titleUa"
  | "titleEn"
  | "descriptionUa"
  | "descriptionEn"
  | "categoryId"
  | "minimumPlan"
  | "coverImage"
  | "modelFile"
  | "previewModelFile";

export type ModelUploadFileFieldName =
  | "coverImage"
  | "modelFile"
  | "previewModelFile";

export type ModelUploadFieldErrors = Partial<
  Record<ModelUploadFormFieldName, string>
>;

export type ModelUploadValidationIssue = {
  path: readonly (string | number | symbol)[];
  message?: string;
};

export type ModelUploadValidationMessageKey =
  | "errors.titleRequired"
  | "errors.titleTooLong"
  | "errors.descriptionTooLong"
  | "errors.categoryRequired"
  | "errors.minimumPlanRequired"
  | "errors.invalidFile"
  | "errors.invalidCoverImage"
  | "errors.fileTooLarge"
  | "errors.coverImageTooLarge"
  | "errors.previewFileTooLarge"
  | "errors.unsupportedFileType"
  | "errors.unsupportedCoverImageType"
  | "errors.unsupportedPreviewFileType";

export type ModelUploadFormErrorMessageKey =
  | "errors.validationFailed"
  | "errors.invalidMetadata"
  | "errors.unauthorized"
  | "errors.uploadFailed"
  | "errors.metadataSaveFailed"
  | "errors.generic"
  | ModelUploadValidationMessageKey;
