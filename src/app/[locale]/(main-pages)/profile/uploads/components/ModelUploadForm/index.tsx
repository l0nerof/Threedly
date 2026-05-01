"use client";

import type {
  ModelUploadActionError,
  ModelUploadActionResult,
} from "@/src/business/types/modelUpload";
import { Button } from "@/src/shared/components/Button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/src/shared/components/Field";
import { Input } from "@/src/shared/components/Input";
import { Textarea } from "@/src/shared/components/Textarea";
import { UploadCloudIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

type CategoryOption = {
  id: string;
  label: string;
};

type ModelUploadFormProps = {
  categories: CategoryOption[];
  onUploadAction: (formData: FormData) => Promise<ModelUploadActionResult>;
};

function ModelUploadForm({ categories, onUploadAction }: ModelUploadFormProps) {
  const t = useTranslations("Profile.uploads.form");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolveActionError = (error: ModelUploadActionError) => {
    switch (error) {
      case "invalidMetadata":
        return t("errors.invalidMetadata");
      case "invalidFile":
        return t("errors.invalidFile");
      case "invalidCoverImage":
        return t("errors.invalidCoverImage");
      case "fileTooLarge":
        return t("errors.fileTooLarge");
      case "coverImageTooLarge":
        return t("errors.coverImageTooLarge");
      case "previewFileTooLarge":
        return t("errors.previewFileTooLarge");
      case "unsupportedFileType":
        return t("errors.unsupportedFileType");
      case "unsupportedCoverImageType":
        return t("errors.unsupportedCoverImageType");
      case "unsupportedPreviewFileType":
        return t("errors.unsupportedPreviewFileType");
      case "unauthorized":
        return t("errors.unauthorized");
      case "uploadFailed":
        return t("errors.uploadFailed");
      case "metadataSaveFailed":
        return t("errors.metadataSaveFailed");
      case "invalidLocale":
      case "generic":
      default:
        return t("errors.generic");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setServerError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await onUploadAction(formData);

      if (!result.ok) {
        const message = resolveActionError(result.error);
        setServerError(message);
        toast.error(message);
        return;
      }

      toast.success(t("success"));
      formRef.current?.reset();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="contents">
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
            <Field>
              <FieldLabel htmlFor="titleUa">{t("titleUa")}</FieldLabel>
              <FieldContent>
                <Input id="titleUa" name="titleUa" required minLength={2} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="titleEn">{t("titleEn")}</FieldLabel>
              <FieldContent>
                <Input id="titleEn" name="titleEn" required minLength={2} />
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="descriptionUa">
                {t("descriptionUa")}
              </FieldLabel>
              <FieldContent>
                <Textarea id="descriptionUa" name="descriptionUa" rows={4} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="descriptionEn">
                {t("descriptionEn")}
              </FieldLabel>
              <FieldContent>
                <Textarea id="descriptionEn" name="descriptionEn" rows={4} />
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="categoryId">{t("category")}</FieldLabel>
              <FieldContent>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  defaultValue=""
                  disabled={categories.length === 0}
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    {t("categoryPlaceholder")}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="minimumPlan">{t("minimumPlan")}</FieldLabel>
              <FieldContent>
                <select
                  id="minimumPlan"
                  name="minimumPlan"
                  defaultValue="free"
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="free">{t("plans.free")}</option>
                  <option value="pro">{t("plans.pro")}</option>
                  <option value="max">{t("plans.max")}</option>
                </select>
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="coverImage">{t("coverImage")}</FieldLabel>
            <FieldContent>
              <Input
                id="coverImage"
                name="coverImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
              />
              <p className="text-muted-foreground text-xs">
                {t("coverImageHint")}
              </p>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="modelFile">{t("file")}</FieldLabel>
            <FieldContent>
              <Input
                id="modelFile"
                name="modelFile"
                type="file"
                accept=".glb,.gltf,.fbx,.obj,.max,.blend,.zip"
                required
              />
              <p className="text-muted-foreground text-xs">{t("fileHint")}</p>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="previewModelFile">
              {t("previewModelFile")}
            </FieldLabel>
            <FieldContent>
              <Input
                id="previewModelFile"
                name="previewModelFile"
                type="file"
                accept=".glb,.gltf"
              />
              <p className="text-muted-foreground text-xs">
                {t("previewModelFileHint")}
              </p>
            </FieldContent>
          </Field>

          <FieldError errors={serverError ? [{ message: serverError }] : []} />
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
