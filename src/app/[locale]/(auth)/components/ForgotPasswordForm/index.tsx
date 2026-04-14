"use client";

import { sendPasswordResetEmail } from "@/src/app/[locale]/(auth)/forgot-password/actions";
import { forgotPasswordSchema } from "@/src/business/schemas/forgotPassword";
import type { ForgotPasswordFormValues } from "@/src/business/types/forgotPassword";
import { Button } from "@/src/shared/components/Button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/src/shared/components/Field";
import { Input } from "@/src/shared/components/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

const defaultValues: ForgotPasswordFormValues = {
  email: "",
};

function ForgotPasswordForm() {
  const t = useTranslations("Auth.forgotPassword");
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues,
    mode: "onBlur",
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resolveServerError = (
    code?: "emailRequired" | "rateLimit" | "generic",
  ) => {
    const errorMessagesByCode = {
      emailRequired: t("errors.emailRequired"),
      rateLimit: t("errors.rateLimit"),
      generic: t("errors.generic"),
    } as const;

    return (
      errorMessagesByCode[code ?? "generic"] ?? errorMessagesByCode.generic
    );
  };

  const resolveErrorMessage = (message?: string) => {
    switch (message) {
      case "errors.emailRequired":
        return t("errors.emailRequired");
      case "errors.emailInvalid":
        return t("errors.emailInvalid");
      default:
        return message;
    }
  };

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    const result = await sendPasswordResetEmail({
      email: values.email,
      locale,
    });

    if (!result.ok) {
      setServerError(resolveServerError(result.error));
      return;
    }

    reset(defaultValues);
    setSuccessMessage(t("success"));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
          <FieldContent>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              className="bg-muted/40 border-border/60"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError
              errors={
                errors.email
                  ? [
                      {
                        ...errors.email,
                        message: resolveErrorMessage(errors.email.message),
                      },
                    ]
                  : []
              }
            />
          </FieldContent>
        </Field>
      </FieldGroup>

      {successMessage ? (
        <p className="text-sm text-green-600 dark:text-green-500">
          {successMessage}
        </p>
      ) : null}

      <FieldError errors={serverError ? [{ message: serverError }] : []} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

export default ForgotPasswordForm;
