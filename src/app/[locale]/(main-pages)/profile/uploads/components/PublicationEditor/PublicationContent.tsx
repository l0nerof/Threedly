"use client";

import { publicationEditorTextFields } from "@/src/business/constants/modelPublicationEditor";
import { modelUploadExtensions } from "@/src/business/constants/modelUpload";
import { modelUploadMinimumPlanOptions } from "@/src/business/constants/modelUploadForm";
import type { usePublicationEditor } from "@/src/business/hooks/usePublicationEditor";
import type { CategoryGroupOption } from "@/src/business/types/category";
import type { UploadCategoryOption } from "@/src/business/types/upload";
import { buildUploadCategoryOptions } from "@/src/business/utils/modelUploadForm";
import { Button } from "@/src/shared/components/Button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/src/shared/components/Combobox";
import { Field, FieldError, FieldLabel } from "@/src/shared/components/Field";
import { Input } from "@/src/shared/components/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/Select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/Tabs";
import { Textarea } from "@/src/shared/components/Textarea";
import { Camera, FileBox, ImagePlus, Undo2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";

type Props = {
  editor: ReturnType<typeof usePublicationEditor>;
  categoryGroups: CategoryGroupOption[] | null;
};

function PrivateCover({
  src,
  title,
  onRefresh,
}: {
  src: string;
  title: string;
  onRefresh: () => Promise<void>;
}) {
  const t = useTranslations("Profile.uploads.editor");
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-muted-foreground text-sm">{t("coverExpired")}</p>
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          await onRefresh();
          setFailed(false);
        }}
      >
        {t("refreshCover")}
      </Button>
    </div>
  ) : (
    <Image
      src={src}
      alt={title}
      fill
      unoptimized
      sizes="(max-width: 1280px) 100vw, 50vw"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function PublicationContent({ editor, categoryGroups }: Props) {
  const t = useTranslations("Profile.uploads.editor");
  const labels = useTranslations("Profile.uploads.form");
  const locale = useLocale();
  const id = useId();
  const categories = useMemo(
    () => buildUploadCategoryOptions(categoryGroups ?? []),
    [categoryGroups],
  );
  const [categoryQuery, setCategoryQuery] = useState("");
  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLocaleLowerCase();
    return categories.filter((category) =>
      category.searchLabel.toLocaleLowerCase().includes(query),
    );
  }, [categories, categoryQuery]);
  const coverInput = useRef<HTMLInputElement>(null);
  const sourceInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(
    null,
  );
  const previewRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );
  const disabled = !editor.editable;
  const filesDisabled = disabled || !editor.canUpload;
  const coverSrc =
    editor.files.cover && preview?.file === editor.files.cover
      ? preview.url
      : editor.saved?.coverUrl;
  const source = editor.files.source ?? editor.saved?.source;
  const currentTitle =
    editor.form.watch(locale === "ua" ? "titleUa" : "titleEn") || t("untitled");
  const numbers = new Intl.NumberFormat(locale === "ua" ? "uk-UA" : "en-US", {
    maximumFractionDigits: 1,
  });
  return (
    <>
      <div className="grid items-start gap-8 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="bg-surface-muted relative aspect-4/3 overflow-hidden rounded-2xl border">
            {coverSrc ? (
              <PrivateCover
                key={coverSrc}
                src={coverSrc}
                title={currentTitle}
                onRefresh={() => editor.run("reload")}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <ImagePlus
                  className="text-muted-foreground size-10"
                  aria-hidden
                />
                <h2 className="text-lg font-medium">{t("coverTitle")}</h2>
                <p className="text-muted-foreground max-w-xs text-sm">
                  {t("coverHint")}
                </p>
              </div>
            )}
            <Button
              type="button"
              variant="secondary"
              className="absolute bottom-4 left-4 rounded-xl shadow-sm"
              disabled={filesDisabled}
              onClick={() => coverInput.current?.click()}
            >
              <Camera aria-hidden />
              {t(coverSrc ? "replaceCover" : "chooseCover")}
            </Button>
          </div>
          <input
            ref={coverInput}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-label={t("chooseCover")}
            accept="image/jpeg,image/png,image/webp"
            disabled={filesDisabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (editor.selectFile("cover", file)) {
                if (previewRef.current) URL.revokeObjectURL(previewRef.current);
                const url = URL.createObjectURL(file);
                previewRef.current = url;
                setPreview({ file, url });
              }
            }}
          />
          <p className="text-muted-foreground text-xs">{t("coverHint")}</p>
          {editor.files.cover && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                {editor.files.cover.name} · {t("localFile")}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => editor.selectFile("cover", null)}
              >
                <Undo2 aria-hidden />
                {t("undoCover")}
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <Tabs defaultValue={locale}>
            <TabsList aria-label={t("contentLanguage")} className="mb-4">
              <TabsTrigger value="ua">Українська</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            {(["ua", "en"] as const).map((language) => (
              <TabsContent
                key={language}
                value={language}
                forceMount
                className="space-y-6 data-[state=inactive]:hidden"
              >
                {publicationEditorTextFields
                  .filter((item) => item.language === language)
                  .map(({ name, multiline }) => (
                    <Controller
                      key={name}
                      name={name}
                      control={editor.form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className="flex flex-wrap items-center gap-2">
                            <FieldLabel htmlFor={`${id}-${name}`}>
                              {labels(name)}
                            </FieldLabel>
                            {multiline && (
                              <span
                                id={`${id}-${name}-optional`}
                                className="text-muted-foreground text-xs"
                              >
                                {t("optional")}
                              </span>
                            )}
                          </div>
                          {multiline ? (
                            <Textarea
                              {...field}
                              id={`${id}-${name}`}
                              lang={language === "ua" ? "uk" : "en"}
                              aria-invalid={fieldState.invalid}
                              aria-describedby={[
                                `${id}-${name}-optional`,
                                fieldState.invalid
                                  ? `${id}-${name}-error`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              value={field.value ?? ""}
                              rows={5}
                              maxLength={600}
                              disabled={disabled}
                              placeholder={t("descriptionPlaceholder")}
                              className="resize-y border-0 border-b px-3 py-3 shadow-none"
                            />
                          ) : (
                            <Input
                              {...field}
                              id={`${id}-${name}`}
                              lang={language === "ua" ? "uk" : "en"}
                              aria-invalid={fieldState.invalid}
                              aria-describedby={
                                fieldState.invalid
                                  ? `${id}-${name}-error`
                                  : undefined
                              }
                              value={field.value ?? ""}
                              maxLength={90}
                              disabled={disabled}
                              placeholder={t("titlePlaceholder")}
                              className="h-auto rounded-none border-0 border-b px-3 py-3 text-2xl font-semibold shadow-none md:text-3xl"
                            />
                          )}
                          {fieldState.error && (
                            <FieldError id={`${id}-${name}-error`}>
                              {t("errors.invalid_request")}
                            </FieldError>
                          )}
                        </Field>
                      )}
                    />
                  ))}
              </TabsContent>
            ))}
          </Tabs>
          <Controller
            name="categoryId"
            control={editor.form.control}
            render={({ field }) => (
              <Field className="border-t pt-6">
                <FieldLabel htmlFor={`${id}-category`}>
                  {labels("category")}
                </FieldLabel>
                <Combobox<UploadCategoryOption>
                  name={field.name}
                  items={categories}
                  filteredItems={filteredCategories}
                  onInputValueChange={setCategoryQuery}
                  value={
                    categories.find(
                      (category) => category.id === field.value,
                    ) ?? null
                  }
                  onValueChange={(category) =>
                    field.onChange(category?.id ?? null)
                  }
                  itemToStringLabel={(category) => category.label}
                  itemToStringValue={(category) => category.id}
                  isItemEqualToValue={(item, value) => item.id === value.id}
                  filter={null}
                  disabled={disabled || categories.length === 0}
                  autoHighlight
                >
                  <ComboboxInput
                    id={`${id}-category`}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    placeholder={t("categorySearchPlaceholder")}
                    triggerLabel={t("categoryTrigger")}
                    clearLabel={t("clearCategory")}
                    showClear
                    disabled={disabled || categories.length === 0}
                    className="h-12 w-full rounded-xl"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{labels("categoryEmpty")}</ComboboxEmpty>
                    <ComboboxList>
                      {(category: UploadCategoryOption) => (
                        <ComboboxItem
                          key={category.id}
                          value={category}
                          aria-label={category.label}
                          aria-description={category.groupLabel}
                        >
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
              </Field>
            )}
          />
          <Controller
            name="minimumPlan"
            control={editor.form.control}
            render={({ field }) => (
              <Field className="border-t pt-6">
                <FieldLabel htmlFor={`${id}-plan`}>
                  {labels("minimumPlan")}
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger
                    id={`${id}-plan`}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    className="h-12 w-full rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelUploadMinimumPlanOptions.map((plan) => (
                      <SelectItem key={plan} value={plan}>
                        {labels(`plans.${plan}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          {!categoryGroups && (
            <p role="alert" className="text-destructive text-sm">
              {t("categoriesUnavailable")}
            </p>
          )}
        </div>
      </div>
      <section
        aria-labelledby={`${id}-source-heading`}
        className="space-y-3 border-t pt-6"
      >
        <h2 id={`${id}-source-heading`} className="font-medium">
          {t("sourceTitle")}
        </h2>
        <div className="bg-surface flex flex-wrap items-center gap-4 rounded-2xl border p-5">
          <FileBox
            className="text-muted-foreground size-8 shrink-0"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium break-all">
              {source?.name ?? t("noSource")}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {source
                ? `${numbers.format(source.size / 1024 / 1024)} MB${editor.files.source ? ` · ${t("localFile")}` : ""}`
                : t("sourceHint")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={filesDisabled}
            onClick={() => sourceInput.current?.click()}
          >
            {t(source ? "replaceSource" : "chooseSource")}
          </Button>
          {editor.files.source && (
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => editor.selectFile("source", null)}
            >
              {t("undoSource")}
            </Button>
          )}
        </div>
        <input
          ref={sourceInput}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-label={t("chooseSource")}
          accept={modelUploadExtensions.map((ext) => `.${ext}`).join(",")}
          disabled={filesDisabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) editor.selectFile("source", file);
          }}
        />
        <p className="text-muted-foreground text-xs">{t("sourceHint")}</p>
      </section>
    </>
  );
}
