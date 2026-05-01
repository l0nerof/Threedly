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
