"use client";

import { loginWithEmailPassword } from "@/src/app/[locale]/(auth)/login/actions";
import { loginSchema } from "@/src/business/schemas/login";
import type { LoginFormValues } from "@/src/business/types/login";
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
import { Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const defaultValues: LoginFormValues = {
  email: "",
  password: "",
};

function LoginForm() {
  const t = useTranslations("Auth.login");
  const locale = useLocale();
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues,
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    const result = await loginWithEmailPassword({
      email: values.email,
      password: values.password,
      locale,
    });

    if (!result.ok) {
      setServerError(resolveServerError(result.error));
      return;
    }

    router.push(result.nextPath ?? `/${locale}`);
    router.refresh();
  };

  const resolveServerError = (
    code?: "invalidCredentials" | "emailNotConfirmed" | "generic",
  ) => {
    const errorMessagesByCode = {
      invalidCredentials: t("errors.invalidCredentials"),
      emailNotConfirmed: t("errors.emailNotConfirmed"),
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
                autoComplete="current-password"
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
      </FieldGroup>
      <FieldError errors={serverError ? [{ message: serverError }] : []} />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  );
}

export default LoginForm;
