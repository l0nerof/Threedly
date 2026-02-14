"use client";

import { signupWithEmailPassword } from "@/src/app/[locale]/(auth)/signup/actions";
import { signupSchema } from "@/src/business/schemas/signup";
import type { SignupFormValues } from "@/src/business/types/signup";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/shared/components/Button";
import { Checkbox } from "@/src/shared/components/Checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/src/shared/components/Field";
import { Input } from "@/src/shared/components/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const defaultValues: SignupFormValues = {
  email: "",
  password: "",
  terms: false,
};

function SignupForm() {
  const t = useTranslations("Auth.signup");
  const locale = useLocale();
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues,
    mode: "onBlur",
  });

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);

    const result = await signupWithEmailPassword({
      email: values.email,
      password: values.password,
      locale,
    });

    if (!result.ok) {
      setServerError(resolveServerError(result.error));
      return;
    }

    router.push(
      result.nextPath ??
        `/${locale}/verify-email?email=${encodeURIComponent(values.email)}`,
    );
    router.refresh();
  };

  const resolveServerError = (
    code?: "alreadyRegistered" | "rateLimit" | "generic",
  ) => {
    const errorMessagesByCode = {
      alreadyRegistered: t("errors.alreadyRegistered"),
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
      case "errors.passwordMinLength":
        return t("errors.passwordMinLength");
      case "errors.termsRequired":
        return t("errors.termsRequired");
      default:
        return message;
    }
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

        <Field>
          <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
          <FieldContent>
            <div className="relative">
              <Input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("passwordPlaceholder")}
                className="bg-muted/40 border-border/60 pr-10"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                aria-label={
                  isPasswordVisible
                    ? t("hidePasswordButton")
                    : t("showPasswordButton")
                }
              >
                {isPasswordVisible ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            <FieldError
              errors={
                errors.password
                  ? [
                      {
                        ...errors.password,
                        message: resolveErrorMessage(errors.password.message),
                      },
                    ]
                  : []
              }
            />
          </FieldContent>
        </Field>

        <Field orientation="horizontal" className="items-center gap-3">
          <Controller
            name="terms"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="terms"
                checked={field.value}
                onCheckedChange={(value) => field.onChange(value === true)}
              />
            )}
          />
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="terms" className="text-sm font-normal">
              {t("termsPrefix")}{" "}
              <Link
                href="/terms"
                className="text-primary underline underline-offset-4"
              >
                {t("termsLink")}
              </Link>
            </FieldLabel>
            <FieldError
              errors={
                errors.terms
                  ? [
                      {
                        ...errors.terms,
                        message: resolveErrorMessage(errors.terms.message),
                      },
                    ]
                  : []
              }
            />
          </div>
        </Field>
      </FieldGroup>

      <FieldError errors={serverError ? [{ message: serverError }] : []} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  );
}

export default SignupForm;
