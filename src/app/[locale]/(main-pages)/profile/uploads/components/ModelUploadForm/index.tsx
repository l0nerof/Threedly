"use client";

import ModelCardShell from "@/src/business/components/ModelCardShell";
import {
  MODEL_UPLOAD_DEFAULT_MINIMUM_PLAN,
  modelUploadMinimumPlanOptions,
  modelUploadPlanLabelKeys,
} from "@/src/business/constants/modelUploadForm";
import {
  emptyFileState,
  studioIntroVariants,
} from "@/src/business/constants/upload";
import { catalogQueryKeys } from "@/src/business/queries/catalog";
import { modelUploadFormSchema } from "@/src/business/schemas/modelUpload";
import type { CatalogPlanKey } from "@/src/business/types/catalog";
import type {
  ModelUploadFieldErrors,
  ModelUploadFormFieldName,
} from "@/src/business/types/modelUpload";
import type {
  ModelUploadFormProps,
  ReadinessItem,
  UploadCategoryOption,
  UploadFileFieldName,
  UploadFileState,
} from "@/src/business/types/upload";
import {
  buildModelUploadFieldErrors,
  buildModelUploadFormValues,
  buildReadinessItems,
  buildUploadCategoryOptions,
  fieldError,
  getModelUploadControlValidationProps,
  resolveModelUploadActionErrorMessageKey,
  resolveModelUploadValidationMessageKey,
} from "@/src/business/utils/modelUploadForm";
import { Badge } from "@/src/shared/components/Badge";
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
import {
  BoxIcon,
  FileArchiveIcon,
  ImageIcon,
  SparklesIcon,
  UploadCloudIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import ReadinessChecklist from "../ReadinessChecklist";
import SectionHeading from "../SectionHeading";
import UploadFileZone from "../UploadFileZone";

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
  const shouldReduceMotion = useReducedMotion();
  const [fileNames, setFileNames] = useState<UploadFileState>(emptyFileState);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [titleUaValue, setTitleUaValue] = useState("");
  const [titleEnValue, setTitleEnValue] = useState("");
  const categories = useMemo<UploadCategoryOption[]>(
    () => buildUploadCategoryOptions(categoryGroups),
    [categoryGroups],
  );
  const selectedCategory =
    categories.find((category) => category.id === categoryId) ?? null;
  const previewTitle = titleEnValue || titleUaValue || t("preview.emptyTitle");
  const previewCategory = selectedCategory?.label ?? t("preview.emptyCategory");
  const readinessItems = useMemo<ReadinessItem[]>(
    () =>
      buildReadinessItems({
        categoryId,
        fileNames,
        labels: {
          modelFile: t("readiness.modelFile"),
          coverImage: t("readiness.coverImage"),
          titleUa: t("readiness.titleUa"),
          titleEn: t("readiness.titleEn"),
          category: t("readiness.category"),
          minimumPlan: t("readiness.minimumPlan"),
        },
        minimumPlan,
        titleEnValue,
        titleUaValue,
      }),
    [categoryId, fileNames, minimumPlan, t, titleEnValue, titleUaValue],
  );

  useEffect(
    () => () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    },
    [coverPreviewUrl],
  );

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

  const handleFileChange =
    (fieldName: UploadFileFieldName) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;

      setFileNames((current) => ({
        ...current,
        [fieldName]: file?.name ?? "",
      }));

      if (fieldName === "coverImage") {
        setCoverPreviewUrl(file ? URL.createObjectURL(file) : null);
      }

      clearFieldError(fieldName);
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
      setFileNames(emptyFileState);
      setCoverPreviewUrl(null);
      setTitleUaValue("");
      setTitleEnValue("");
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
    <motion.form
      ref={formRef}
      onSubmit={handleSubmit}
      className="contents"
      noValidate
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      variants={studioIntroVariants}
    >
      <CardHeader className="border-border/60 bg-background/55 flex flex-col gap-3 border-b p-5 lg:p-6">
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20 w-fit rounded-full"
        >
          {t("studioBadge")}
        </Badge>
        <div className="flex flex-col gap-2">
          <CardTitle>
            <h2>{t("title")}</h2>
          </CardTitle>
          <CardDescription className="max-w-3xl leading-6">
            {t("description")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-6">
        <FieldGroup className="order-2 min-w-0 gap-8 lg:order-1">
          <div className="flex flex-col gap-4">
            <SectionHeading
              icon={FileArchiveIcon}
              title={t("sections.files")}
            />
            <div className="grid items-stretch gap-4 xl:grid-cols-3">
              <Field
                data-invalid={Boolean(fieldErrors.coverImage)}
                className="h-full"
              >
                <FieldContent className="h-full">
                  <UploadFileZone
                    id="coverImage"
                    name="coverImage"
                    accept="image/jpeg,image/png,image/webp"
                    title={t("fileZones.coverTitle")}
                    description={t("fileZones.coverDescription")}
                    selectedFileName={fileNames.coverImage}
                    emptyLabel={t("fileZones.empty")}
                    selectedLabel={t("fileZones.selected")}
                    required
                    invalid={Boolean(fieldErrors.coverImage)}
                    inputProps={getModelUploadControlValidationProps(
                      fieldErrors,
                      "coverImage",
                    )}
                    icon={ImageIcon}
                    onChange={handleFileChange("coverImage")}
                  />
                  <FieldError
                    id="coverImage-error"
                    errors={fieldError(fieldErrors.coverImage)}
                  />
                </FieldContent>
              </Field>

              <Field
                data-invalid={Boolean(fieldErrors.modelFile)}
                className="h-full"
              >
                <FieldContent className="h-full">
                  <UploadFileZone
                    id="modelFile"
                    name="modelFile"
                    accept=".glb,.gltf,.fbx,.obj,.max,.blend,.zip"
                    title={t("file")}
                    description={t("fileZones.modelDescription")}
                    selectedFileName={fileNames.modelFile}
                    emptyLabel={t("fileZones.empty")}
                    selectedLabel={t("fileZones.selected")}
                    required
                    invalid={Boolean(fieldErrors.modelFile)}
                    inputProps={getModelUploadControlValidationProps(
                      fieldErrors,
                      "modelFile",
                    )}
                    icon={FileArchiveIcon}
                    onChange={handleFileChange("modelFile")}
                  />
                  <FieldError
                    id="modelFile-error"
                    errors={fieldError(fieldErrors.modelFile)}
                  />
                </FieldContent>
              </Field>

              <Field
                data-invalid={Boolean(fieldErrors.previewModelFile)}
                className="h-full"
              >
                <FieldContent className="h-full">
                  <UploadFileZone
                    id="previewModelFile"
                    name="previewModelFile"
                    accept=".glb,.gltf"
                    title={t("fileZones.previewTitle")}
                    description={t("fileZones.previewDescription")}
                    selectedFileName={fileNames.previewModelFile}
                    emptyLabel={t("fileZones.empty")}
                    selectedLabel={t("fileZones.selected")}
                    invalid={Boolean(fieldErrors.previewModelFile)}
                    inputProps={getModelUploadControlValidationProps(
                      fieldErrors,
                      "previewModelFile",
                    )}
                    icon={BoxIcon}
                    onChange={handleFileChange("previewModelFile")}
                  />
                  <FieldError
                    id="previewModelFile-error"
                    errors={fieldError(fieldErrors.previewModelFile)}
                  />
                </FieldContent>
              </Field>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SectionHeading
              icon={SparklesIcon}
              title={t("sections.metadata")}
              variant="accent"
            />
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
                    value={titleUaValue}
                    aria-required
                    onChange={(event) => {
                      setTitleUaValue(event.target.value);
                      clearFieldError("titleUa");
                    }}
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
                    value={titleEnValue}
                    aria-required
                    onChange={(event) => {
                      setTitleEnValue(event.target.value);
                      clearFieldError("titleEn");
                    }}
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
          </div>

          <div className="flex flex-col gap-4">
            <SectionHeading
              icon={BoxIcon}
              title={t("sections.settings")}
              variant="secondary"
            />
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
          </div>

          <FieldError errors={fieldError(serverError ?? undefined)} />
        </FieldGroup>

        <aside className="order-1 flex flex-col gap-4 lg:sticky lg:top-28 lg:order-2 lg:self-start">
          <ModelCardShell
            title={previewTitle}
            plan={minimumPlan}
            planLabel={t(modelUploadPlanLabelKeys[minimumPlan])}
            eyebrow={t("preview.title")}
            mediaClassName="from-primary/10 via-accent/10 h-52 bg-linear-to-br to-transparent"
            meta={
              fileNames.coverImage
                ? t("preview.coverReady")
                : t("preview.coverMissing")
            }
            subtitle={previewCategory}
            media={
              coverPreviewUrl ? (
                <Image
                  src={coverPreviewUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 320px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparklesIcon
                    className="text-primary/45 size-10"
                    aria-hidden
                  />
                </div>
              )
            }
          />

          <ReadinessChecklist
            title={t("readiness.title")}
            items={readinessItems}
            completeLabel={t("readiness.complete")}
            missingLabel={t("readiness.missing")}
          />
        </aside>
      </CardContent>

      <CardFooter className="border-border/60 bg-background/55 flex flex-col gap-3 border-t p-5 sm:flex-row sm:justify-end lg:p-6">
        <Button
          type="submit"
          disabled={isSubmitting || categories.length === 0}
          className="group w-full rounded-full sm:w-auto"
        >
          <UploadCloudIcon data-icon="inline-start" aria-hidden />
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </CardFooter>
    </motion.form>
  );
}

export default ModelUploadForm;
