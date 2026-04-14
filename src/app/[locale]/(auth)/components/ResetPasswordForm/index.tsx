"use client";

import { resetPasswordSchema } from "@/src/business/schemas/resetPassword";
import type { ResetPasswordFormValues } from "@/src/business/types/resetPassword";
import { createClient } from "@/src/business/utils/supabase/client";
import { Link } from "@/src/i18n/routing";
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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type RecoveryState = "loading" | "ready" | "invalid";

const defaultValues: ResetPasswordFormValues = {
  password: "",
  confirmPassword: "",
};

function ResetPasswordForm() {
  const t = useTranslations("Auth.resetPassword");
  const locale = useLocale();
  const router = useRouter();
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("loading");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const syncRecoveryState = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setRecoveryState(session ? "ready" : "invalid");
    };

    void syncRecoveryState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setRecoveryState(session ? "ready" : "invalid");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const resolveServerError = (message?: string) => {
    if (!message) {
      return t("errors.generic");
    }

    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("same password") ||
      normalizedMessage.includes("should be different") ||
      normalizedMessage.includes("new password should be different")
    ) {
      return t("errors.samePassword");
    }

    return t("errors.generic");
  };

  const resolveErrorMessage = (message?: string) => {
    switch (message) {
      case "errors.passwordMinLength":
        return t("errors.passwordMinLength");
      case "errors.confirmPasswordRequired":
        return t("errors.confirmPasswordRequired");
      case "errors.passwordMismatch":
        return t("errors.passwordMismatch");
      default:
        return message;
    }
  };

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (recoveryState !== "ready") {
      setServerError(t("errors.invalidRecoveryState"));
      return;
    }

    setServerError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setServerError(resolveServerError(error.message));
      return;
    }

    await supabase.auth.signOut();
    reset(defaultValues);
    router.push(`/${locale}/login?reset=success`);
    router.refresh();
  };

  if (recoveryState === "loading") {
    return <p className="text-muted-foreground text-sm">{t("checking")}</p>;
  }

  if (recoveryState === "invalid") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-red-600 dark:text-red-500">
          {t("errors.invalidRecoveryState")}
        </p>
        <Link
          href="/forgot-password"
          className="text-primary text-sm underline underline-offset-4"
        >
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
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
        <Field>
          <FieldLabel htmlFor="confirmPassword">
            {t("confirmPasswordLabel")}
          </FieldLabel>
          <FieldContent>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={isConfirmPasswordVisible ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("confirmPasswordPlaceholder")}
                className="bg-muted/40 border-border/60 pr-10"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
                aria-label={
                  isConfirmPasswordVisible
                    ? t("hidePasswordButton")
                    : t("showPasswordButton")
                }
              >
                {isConfirmPasswordVisible ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            <FieldError
              errors={
                errors.confirmPassword
                  ? [
                      {
                        ...errors.confirmPassword,
                        message: resolveErrorMessage(
                          errors.confirmPassword.message,
                        ),
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
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

export default ResetPasswordForm;
