import {
  modelUploadActionErrorMessageKeys,
  modelUploadFormFieldNames,
  modelUploadValidationMessageKeys,
} from "@/src/business/constants/modelUploadForm";
import type { CatalogPlanKey } from "@/src/business/types/catalog";
import type { CategoryGroupOption } from "@/src/business/types/category";
import type {
  ModelUploadActionError,
  ModelUploadFieldErrors,
  ModelUploadFileFieldName,
  ModelUploadFormErrorMessageKey,
  ModelUploadFormFieldName,
  ModelUploadValidationIssue,
  ModelUploadValidationMessageKey,
} from "@/src/business/types/modelUpload";
import type {
  ReadinessItem,
  UploadCategoryOption,
  UploadFileState,
} from "@/src/business/types/upload";

type ReadinessLabels = {
  modelFile: string;
  coverImage: string;
  titleUa: string;
  titleEn: string;
  category: string;
  minimumPlan: string;
};

type BuildReadinessItemsArgs = {
  categoryId: string;
  fileNames: UploadFileState;
  labels: ReadinessLabels;
  minimumPlan: CatalogPlanKey;
  titleEnValue: string;
  titleUaValue: string;
};

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

export function buildUploadCategoryOptions(
  categoryGroups: CategoryGroupOption[],
): UploadCategoryOption[] {
  return categoryGroups.flatMap((group) =>
    group.categories.map((category) => ({
      id: category.id,
      value: category.value,
      label: category.label,
      groupLabel: group.label,
      searchLabel: `${group.label} ${category.label}`,
    })),
  );
}

export function buildReadinessItems({
  categoryId,
  fileNames,
  labels,
  minimumPlan,
  titleEnValue,
  titleUaValue,
}: BuildReadinessItemsArgs): ReadinessItem[] {
  return [
    {
      key: "modelFile",
      label: labels.modelFile,
      isComplete: Boolean(fileNames.modelFile),
    },
    {
      key: "coverImage",
      label: labels.coverImage,
      isComplete: Boolean(fileNames.coverImage),
    },
    {
      key: "titleUa",
      label: labels.titleUa,
      isComplete: titleUaValue.trim().length >= 2,
    },
    {
      key: "titleEn",
      label: labels.titleEn,
      isComplete: titleEnValue.trim().length >= 2,
    },
    {
      key: "category",
      label: labels.category,
      isComplete: Boolean(categoryId),
    },
    {
      key: "minimumPlan",
      label: labels.minimumPlan,
      isComplete: Boolean(minimumPlan),
    },
  ];
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
