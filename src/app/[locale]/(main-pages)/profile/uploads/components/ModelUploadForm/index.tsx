"use client";

import {
  MODEL_UPLOAD_DEFAULT_MINIMUM_PLAN,
  modelUploadMinimumPlanOptions,
  modelUploadPlanLabelKeys,
} from "@/src/business/constants/modelUploadForm";
import { catalogQueryKeys } from "@/src/business/queries/catalog";
import { modelUploadFormSchema } from "@/src/business/schemas/modelUpload";
import type { CatalogPlanKey } from "@/src/business/types/catalog";
import type { CategoryGroupOption } from "@/src/business/types/category";
import type {
  ModelUploadActionResult,
  ModelUploadFieldErrors,
  ModelUploadFormFieldName,
} from "@/src/business/types/modelUpload";
import {
  buildModelUploadFieldErrors,
  buildModelUploadFormValues,
  fieldError,
  getModelUploadControlValidationProps,
  resolveModelUploadActionErrorMessageKey,
  resolveModelUploadValidationMessageKey,
} from "@/src/business/utils/modelUploadForm";
import { Button } from "@/src/shared/components/Button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/src/shared/components/Combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/src/shared/components/Field";
import { Input } from "@/src/shared/components/Input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/Select";
import { Textarea } from "@/src/shared/components/Textarea";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloudIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ModelUploadFormProps = {
  categoryGroups: CategoryGroupOption[];
  onUploadAction: (formData: FormData) => Promise<ModelUploadActionResult>;
};

type UploadCategoryOption = {
  id: string;
  value: string;
  label: string;
  groupLabel: string;
  searchLabel: string;
};

function ModelUploadForm({
  categoryGroups,
  onUploadAction,
}: ModelUploadFormProps) {
  const t = useTranslations("Profile.uploads.form");
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ModelUploadFieldErrors>({});
  const [categoryId, setCategoryId] = useState("");
  const [minimumPlan, setMinimumPlan] = useState<CatalogPlanKey>(
    MODEL_UPLOAD_DEFAULT_MINIMUM_PLAN,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const categories = useMemo<UploadCategoryOption[]>(
    () =>
      categoryGroups.flatMap((group) =>
        group.categories.map((category) => ({
          id: category.id,
          value: category.value,
          label: category.label,
          groupLabel: group.label,
          searchLabel: `${group.label} ${category.label}`,
        })),
      ),
    [categoryGroups],
  );
  const selectedCategory =
    categories.find((category) => category.id === categoryId) ?? null;

  const clearFieldError = (fieldName: ModelUploadFormFieldName) => {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];

      return nextErrors;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("categoryId", categoryId);
    formData.set("minimumPlan", minimumPlan);

    const parsedForm = modelUploadFormSchema.safeParse(
      buildModelUploadFormValues({
        formData,
        categoryId,
        minimumPlan,
      }),
    );

    if (!parsedForm.success) {
      setServerError(null);
      setFieldErrors(
        buildModelUploadFieldErrors(parsedForm.error.issues, (message) =>
          t(resolveModelUploadValidationMessageKey(message)),
        ),
      );
      toast.error(t("errors.validationFailed"));
      return;
    }

    setServerError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await onUploadAction(formData);

      if (!result.ok) {
        const message = t(
          resolveModelUploadActionErrorMessageKey(result.error),
        );
        setServerError(message);
        toast.error(message);
        return;
      }

      toast.success(t("success"));
      formRef.current?.reset();
      setCategoryId("");
      setMinimumPlan(MODEL_UPLOAD_DEFAULT_MINIMUM_PLAN);
      void queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.models(),
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="contents" noValidate>
      <CardHeader className="p-0">
        <CardTitle>
          <h2>{t("title")}</h2>
        </CardTitle>
        <CardDescription className="leading-6">
          {t("description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={Boolean(fieldErrors.titleUa)}>
              <FieldLabel htmlFor="titleUa">
                {t("titleUa")}
                <span aria-hidden className="text-destructive">
                  *
                </span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="titleUa"
                  name="titleUa"
                  aria-required
                  onChange={() => clearFieldError("titleUa")}
                  {...getModelUploadControlValidationProps(
                    fieldErrors,
                    "titleUa",
                  )}
                />
                <FieldError
                  id="titleUa-error"
                  errors={fieldError(fieldErrors.titleUa)}
                />
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(fieldErrors.titleEn)}>
              <FieldLabel htmlFor="titleEn">
                {t("titleEn")}
                <span aria-hidden className="text-destructive">
                  *
                </span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="titleEn"
                  name="titleEn"
                  aria-required
                  onChange={() => clearFieldError("titleEn")}
                  {...getModelUploadControlValidationProps(
                    fieldErrors,
                    "titleEn",
                  )}
                />
                <FieldError
                  id="titleEn-error"
                  errors={fieldError(fieldErrors.titleEn)}
                />
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={Boolean(fieldErrors.descriptionUa)}>
              <FieldLabel htmlFor="descriptionUa">
                {t("descriptionUa")}
              </FieldLabel>
              <FieldContent>
                <Textarea
                  id="descriptionUa"
                  name="descriptionUa"
                  rows={4}
                  onChange={() => clearFieldError("descriptionUa")}
                  {...getModelUploadControlValidationProps(
                    fieldErrors,
                    "descriptionUa",
                  )}
                />
                <FieldError
                  id="descriptionUa-error"
                  errors={fieldError(fieldErrors.descriptionUa)}
                />
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(fieldErrors.descriptionEn)}>
              <FieldLabel htmlFor="descriptionEn">
                {t("descriptionEn")}
              </FieldLabel>
              <FieldContent>
                <Textarea
                  id="descriptionEn"
                  name="descriptionEn"
                  rows={4}
                  onChange={() => clearFieldError("descriptionEn")}
                  {...getModelUploadControlValidationProps(
                    fieldErrors,
                    "descriptionEn",
                  )}
                />
                <FieldError
                  id="descriptionEn-error"
                  errors={fieldError(fieldErrors.descriptionEn)}
                />
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              data-disabled={categories.length === 0}
              data-invalid={Boolean(fieldErrors.categoryId)}
            >
              <FieldLabel htmlFor="categoryId">
                {t("category")}
                <span aria-hidden className="text-destructive">
                  *
                </span>
              </FieldLabel>
              <FieldContent>
                <Combobox
                  name="categoryId"
                  items={categories}
                  value={selectedCategory}
                  onValueChange={(category) => {
                    setCategoryId(category?.id ?? "");
                    clearFieldError("categoryId");
                  }}
                  itemToStringLabel={(category) => category.label}
                  itemToStringValue={(category) => category.id}
                  isItemEqualToValue={(item, value) => item.id === value.id}
                  filter={(category, query) =>
                    category.searchLabel
                      .toLocaleLowerCase()
                      .includes(query.toLocaleLowerCase())
                  }
                  disabled={categories.length === 0}
                  autoHighlight
                >
                  <ComboboxInput
                    id="categoryId"
                    placeholder={t("categoryPlaceholder")}
                    aria-label={t("category")}
                    aria-required
                    showClear
                    disabled={categories.length === 0}
                    className="w-full"
                    {...getModelUploadControlValidationProps(
                      fieldErrors,
                      "categoryId",
                    )}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{t("categoryEmpty")}</ComboboxEmpty>
                    <ComboboxList>
                      {(category: UploadCategoryOption) => (
                        <ComboboxItem key={category.id} value={category}>
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate">{category.label}</span>
                            <span className="text-muted-foreground truncate text-xs">
                              {category.groupLabel}
                            </span>
                          </span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldError
                  id="categoryId-error"
                  errors={fieldError(fieldErrors.categoryId)}
                />
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(fieldErrors.minimumPlan)}>
              <FieldLabel htmlFor="minimumPlan">
                {t("minimumPlan")}
                <span aria-hidden className="text-destructive">
                  *
                </span>
              </FieldLabel>
              <FieldContent>
                <Select
                  name="minimumPlan"
                  value={minimumPlan}
                  onValueChange={(value) => {
                    setMinimumPlan(value as CatalogPlanKey);
                    clearFieldError("minimumPlan");
                  }}
                >
                  <SelectTrigger
                    id="minimumPlan"
                    className="w-full"
                    aria-required
                    {...getModelUploadControlValidationProps(
                      fieldErrors,
                      "minimumPlan",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {modelUploadMinimumPlanOptions.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {t(modelUploadPlanLabelKeys[plan])}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError
                  id="minimumPlan-error"
                  errors={fieldError(fieldErrors.minimumPlan)}
                />
              </FieldContent>
            </Field>
          </div>

          <Field data-invalid={Boolean(fieldErrors.coverImage)}>
            <FieldLabel htmlFor="coverImage">
              {t("coverImage")}
              <span aria-hidden className="text-destructive">
                *
              </span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="coverImage"
                name="coverImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-required
                onChange={() => clearFieldError("coverImage")}
                {...getModelUploadControlValidationProps(
                  fieldErrors,
                  "coverImage",
                )}
              />
              <FieldDescription>{t("coverImageHint")}</FieldDescription>
              <FieldError
                id="coverImage-error"
                errors={fieldError(fieldErrors.coverImage)}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.modelFile)}>
            <FieldLabel htmlFor="modelFile">
              {t("file")}
              <span aria-hidden className="text-destructive">
                *
              </span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="modelFile"
                name="modelFile"
                type="file"
                accept=".glb,.gltf,.fbx,.obj,.max,.blend,.zip"
                aria-required
                onChange={() => clearFieldError("modelFile")}
                {...getModelUploadControlValidationProps(
                  fieldErrors,
                  "modelFile",
                )}
              />
              <FieldDescription>{t("fileHint")}</FieldDescription>
              <FieldError
                id="modelFile-error"
                errors={fieldError(fieldErrors.modelFile)}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.previewModelFile)}>
            <FieldLabel htmlFor="previewModelFile">
              {t("previewModelFile")}
            </FieldLabel>
            <FieldContent>
              <Input
                id="previewModelFile"
                name="previewModelFile"
                type="file"
                accept=".glb,.gltf"
                onChange={() => clearFieldError("previewModelFile")}
                {...getModelUploadControlValidationProps(
                  fieldErrors,
                  "previewModelFile",
                )}
              />
              <FieldDescription>{t("previewModelFileHint")}</FieldDescription>
              <FieldError
                id="previewModelFile-error"
                errors={fieldError(fieldErrors.previewModelFile)}
              />
            </FieldContent>
          </Field>

          <FieldError errors={fieldError(serverError ?? undefined)} />
        </FieldGroup>
      </CardContent>

      <CardFooter className="justify-end p-0">
        <Button
          type="submit"
          disabled={isSubmitting || categories.length === 0}
        >
          <UploadCloudIcon data-icon="inline-start" aria-hidden />
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </CardFooter>
    </form>
  );
}

export default ModelUploadForm;
