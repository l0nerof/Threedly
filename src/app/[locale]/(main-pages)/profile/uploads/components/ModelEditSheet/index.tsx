"use client";

import { modelManagementTextFields } from "@/src/business/constants/modelManagement";
import { modelUploadMinimumPlanOptions } from "@/src/business/constants/modelUploadForm";
import { modelManagementMetadataSchema } from "@/src/business/schemas/modelManagement";
import type { CategoryGroupOption } from "@/src/business/types/category";
import type {
  ModelManagementError,
  ModelManagementMetadata,
  ModelManagementResult,
  OwnedModel,
  OwnedModelReadResult,
} from "@/src/business/types/modelManagement";
import { toModelManagementMetadata } from "@/src/business/utils/modelManagement";
import { Button } from "@/src/shared/components/Button";
import {
  Field,
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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/Select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/Sheet";
import { Textarea } from "@/src/shared/components/Textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  read: () => Promise<OwnedModelReadResult>;
  onSave: (
    metadata: ModelManagementMetadata,
  ) => Promise<ModelManagementResult | null>;
  categoryGroups: CategoryGroupOption[] | null;
  isPending: boolean;
  canSubmit: boolean;
  error: ModelManagementError | null;
};

export default function ModelEditSheet(props: Props) {
  const t = useTranslations("Profile.uploads.management");
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        className="w-full overflow-y-auto motion-reduce:animate-none motion-reduce:transition-none sm:max-w-2xl"
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (props.isPending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (props.isPending) event.preventDefault();
        }}
      >
        <SheetHeader className="pr-14">
          <SheetTitle>{t("editTitle")}</SheetTitle>
          <SheetDescription>{t("editDescription")}</SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3"
            aria-label={t("close")}
            disabled={props.isPending}
          >
            <XIcon aria-hidden />
          </Button>
        </SheetClose>
        {props.open && <EditorContents {...props} />}
      </SheetContent>
    </Sheet>
  );
}

function EditorContents(props: Props) {
  const t = useTranslations("Profile.uploads.management");
  const { read } = props;
  const [result, setResult] = useState<OwnedModelReadResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    read().then((response) => {
      if (active) setResult(response);
    });
    return () => {
      active = false;
    };
  }, [attempt, read]);
  if (!result)
    return (
      <p role="status" className="px-4 text-sm">
        {t("loading")}
      </p>
    );
  if (!result.ok)
    return (
      <div className="space-y-3 px-4">
        <p role="alert" className="text-destructive text-sm">
          {t(`errors.${result.error}`)}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setResult(null);
            setAttempt((value) => value + 1);
          }}
        >
          {t("retry")}
        </Button>
      </div>
    );
  if (result.model.deletion_pending)
    return (
      <p role="alert" className="px-4 text-sm">
        {t("deletionPending")}
      </p>
    );
  if (!props.categoryGroups?.some((group) => group.categories.length))
    return (
      <p role="alert" className="px-4 text-sm">
        {t("categoriesUnavailable")}
      </p>
    );
  return (
    <EditForm
      {...props}
      model={result.model}
      categoryGroups={props.categoryGroups}
    />
  );
}

function EditForm({
  model,
  categoryGroups,
  onSave,
  onOpenChange,
  isPending,
  canSubmit,
  error,
}: Props & { model: OwnedModel; categoryGroups: CategoryGroupOption[] }) {
  const t = useTranslations("Profile.uploads.management");
  const labels = useTranslations("Profile.uploads.form");
  const id = useId();
  const form = useForm<ModelManagementMetadata>({
    resolver: zodResolver(modelManagementMetadataSchema),
    defaultValues: toModelManagementMetadata(model),
  });
  const disabled = isPending || form.formState.isSubmitting || !canSubmit;
  return (
    <form
      noValidate
      className="flex flex-1 flex-col gap-6 p-4 pt-0"
      aria-busy={isPending}
      onSubmit={form.handleSubmit(async (metadata) => {
        if (disabled) return;
        const result = await onSave(metadata);
        if (result?.ok) onOpenChange(false);
      })}
    >
      <FieldGroup>
        {modelManagementTextFields.map(({ name, multiline }) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => {
              const controlProps = {
                ...field,
                id: `${id}-${name}`,
                value: field.value ?? "",
                disabled,
                "aria-invalid": fieldState.invalid,
                "aria-describedby": fieldState.invalid
                  ? `${id}-${name}-error`
                  : undefined,
              };
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={controlProps.id}>
                    {labels(name)}
                  </FieldLabel>
                  {multiline ? (
                    <Textarea {...controlProps} rows={4} />
                  ) : (
                    <Input {...controlProps} />
                  )}
                  {fieldState.invalid && (
                    <FieldError id={`${id}-${name}-error`}>
                      {t("invalidField")}
                    </FieldError>
                  )}
                </Field>
              );
            }}
          />
        ))}
        <Controller
          name="categoryId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-category`}>
                {labels("category")}
              </FieldLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger
                  id={`${id}-category`}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? `${id}-category-error` : undefined
                  }
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryGroups.map((group) => (
                    <SelectGroup key={group.value}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && (
                <FieldError id={`${id}-category-error`}>
                  {t("invalidField")}
                </FieldError>
              )}
            </Field>
          )}
        />
        <Controller
          name="minimumPlan"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-plan`}>
                {labels("minimumPlan")}
              </FieldLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger
                  id={`${id}-plan`}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? `${id}-plan-error` : undefined
                  }
                  className="w-full"
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
              {fieldState.invalid && (
                <FieldError id={`${id}-plan-error`}>
                  {t("invalidField")}
                </FieldError>
              )}
            </Field>
          )}
        />
      </FieldGroup>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {t(`errors.${error}`)}
        </p>
      )}
      <div className="mt-auto flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={disabled}>
          {t(isPending ? "pending" : "save")}
        </Button>
      </div>
    </form>
  );
}
