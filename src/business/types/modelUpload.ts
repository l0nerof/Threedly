import type { modelUploadExtensions } from "@/src/business/constants/modelUpload";
import type { modelUploadMetadataSchema } from "@/src/business/schemas/modelUpload";
import type { z } from "zod";

export type ModelUploadExtension = (typeof modelUploadExtensions)[number];

export type ModelUploadMetadataValues = z.infer<
  typeof modelUploadMetadataSchema
>;

export type ModelUploadActionError =
  | "invalidLocale"
  | "invalidMetadata"
  | "invalidFile"
  | "fileTooLarge"
  | "unsupportedFileType"
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
