import {
  modelUploadActionErrorMessageKeys,
  modelUploadFormFieldNames,
  modelUploadValidationMessageKeys,
} from "@/src/business/constants/modelUploadForm";
import type { CatalogPlanKey } from "@/src/business/types/catalog";
import type {
  ModelUploadActionError,
  ModelUploadFieldErrors,
  ModelUploadFileFieldName,
  ModelUploadFormErrorMessageKey,
  ModelUploadFormFieldName,
  ModelUploadValidationIssue,
  ModelUploadValidationMessageKey,
} from "@/src/business/types/modelUpload";

export function isModelUploadFormFieldName(
  value: unknown,
): value is ModelUploadFormFieldName {
  return (
    typeof value === "string" &&
    modelUploadFormFieldNames.includes(value as ModelUploadFormFieldName)
  );
}

export function isModelUploadValidationMessageKey(
  value: string | undefined,
): value is ModelUploadValidationMessageKey {
  return modelUploadValidationMessageKeys.includes(
    value as ModelUploadValidationMessageKey,
  );
}

export function readModelUploadTextValue(
  formData: FormData,
  fieldName: string,
): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

export function readModelUploadFileValue(
  formData: FormData,
  fieldName: ModelUploadFileFieldName,
): File | null {
  const value = formData.get(fieldName);

  if (typeof File === "undefined" || !(value instanceof File)) {
    return null;
  }

  return value;
}

export function buildModelUploadFormValues({
  formData,
  categoryId,
  minimumPlan,
}: {
  formData: FormData;
  categoryId: string;
  minimumPlan: CatalogPlanKey;
}) {
  return {
    titleUa: readModelUploadTextValue(formData, "titleUa"),
    titleEn: readModelUploadTextValue(formData, "titleEn"),
    descriptionUa: readModelUploadTextValue(formData, "descriptionUa"),
    descriptionEn: readModelUploadTextValue(formData, "descriptionEn"),
    categoryId,
    minimumPlan,
    modelFile: readModelUploadFileValue(formData, "modelFile"),
    coverImage: readModelUploadFileValue(formData, "coverImage"),
    previewModelFile: readModelUploadFileValue(formData, "previewModelFile"),
  };
}

export function resolveModelUploadValidationMessageKey(
  message: string | undefined,
): ModelUploadFormErrorMessageKey {
  return isModelUploadValidationMessageKey(message)
    ? message
    : "errors.generic";
}

export function resolveModelUploadActionErrorMessageKey(
  error: ModelUploadActionError,
): ModelUploadFormErrorMessageKey {
  return modelUploadActionErrorMessageKeys[error];
}

export function buildModelUploadFieldErrors(
  issues: ModelUploadValidationIssue[],
  resolveMessage: (message: string | undefined) => string,
): ModelUploadFieldErrors {
  return issues.reduce<ModelUploadFieldErrors>((fieldErrors, issue) => {
    const fieldName = issue.path[0];

    if (isModelUploadFormFieldName(fieldName) && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = resolveMessage(issue.message);
    }

    return fieldErrors;
  }, {});
}

export function getModelUploadControlValidationProps(
  fieldErrors: ModelUploadFieldErrors,
  fieldName: ModelUploadFormFieldName,
) {
  return {
    "aria-describedby": fieldErrors[fieldName]
      ? `${fieldName}-error`
      : undefined,
    "aria-invalid": Boolean(fieldErrors[fieldName]),
  };
}

export function fieldError(message: string | undefined) {
  return message ? [{ message }] : [];
}
