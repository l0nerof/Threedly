import { catalogPlanKeys } from "@/src/business/constants/catalogConfig";
import type { CatalogPlanKey } from "@/src/business/types/catalog";
import type {
  ModelUploadActionError,
  ModelUploadFormErrorMessageKey,
  ModelUploadFormFieldName,
  ModelUploadValidationMessageKey,
} from "@/src/business/types/modelUpload";

export const MODEL_UPLOAD_DEFAULT_MINIMUM_PLAN: CatalogPlanKey = "free";

export const modelUploadFormFieldNames = [
  "titleUa",
  "titleEn",
  "descriptionUa",
  "descriptionEn",
  "categoryId",
  "minimumPlan",
  "coverImage",
  "modelFile",
  "previewModelFile",
] as const satisfies readonly ModelUploadFormFieldName[];

export const modelUploadPlanLabelKeys = {
  free: "plans.free",
  pro: "plans.pro",
  max: "plans.max",
} as const satisfies Record<CatalogPlanKey, string>;

export const modelUploadValidationMessageKeys = [
  "errors.titleRequired",
  "errors.titleTooLong",
  "errors.descriptionTooLong",
  "errors.categoryRequired",
  "errors.minimumPlanRequired",
  "errors.invalidFile",
  "errors.invalidCoverImage",
  "errors.fileTooLarge",
  "errors.coverImageTooLarge",
  "errors.previewFileTooLarge",
  "errors.unsupportedFileType",
  "errors.unsupportedCoverImageType",
  "errors.unsupportedPreviewFileType",
] as const satisfies readonly ModelUploadValidationMessageKey[];

export const modelUploadActionErrorMessageKeys = {
  invalidLocale: "errors.generic",
  invalidMetadata: "errors.invalidMetadata",
  invalidFile: "errors.invalidFile",
  invalidCoverImage: "errors.invalidCoverImage",
  fileTooLarge: "errors.fileTooLarge",
  coverImageTooLarge: "errors.coverImageTooLarge",
  previewFileTooLarge: "errors.previewFileTooLarge",
  unsupportedFileType: "errors.unsupportedFileType",
  unsupportedCoverImageType: "errors.unsupportedCoverImageType",
  unsupportedPreviewFileType: "errors.unsupportedPreviewFileType",
  unauthorized: "errors.unauthorized",
  uploadFailed: "errors.uploadFailed",
  metadataSaveFailed: "errors.metadataSaveFailed",
  generic: "errors.generic",
} as const satisfies Record<
  ModelUploadActionError,
  ModelUploadFormErrorMessageKey
>;

export const modelUploadMinimumPlanOptions = catalogPlanKeys;
