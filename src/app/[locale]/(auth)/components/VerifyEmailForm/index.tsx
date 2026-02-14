"use client";

import { Button } from "@/src/shared/components/Button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/src/shared/components/Field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/src/shared/components/InputOTP";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { resendEmailOtp, verifyEmailOtp } from "../../verify-email/actions";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 8;

type VerifyEmailFormProps = {
  initialEmail: string;
};

function VerifyEmailForm({ initialEmail }: VerifyEmailFormProps) {
  const t = useTranslations("Auth.verifyEmail");
  const locale = useLocale();
  const router = useRouter();

  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(
    RESEND_COOLDOWN_SECONDS,
  );

  useEffect(() => {
    if (cooldownSecondsLeft <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setCooldownSecondsLeft((prevValue) => {
        if (prevValue <= 1) {
          window.clearInterval(timerId);
          return 0;
        }

        return prevValue - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [cooldownSecondsLeft]);

  const canResend = cooldownSecondsLeft === 0;
  const hasEmail = Boolean(email.trim());
  const isVerifyDisabled =
    isVerifying || otp.length !== OTP_LENGTH || !hasEmail;

  const resolveServerError = (
    code?:
      | "requiredFields"
      | "emailRequired"
      | "invalidCode"
      | "codeExpired"
      | "rateLimit"
      | "generic",
  ) => {
    const errorMessagesByCode = {
      requiredFields: t("errors.requiredFields"),
      emailRequired: t("errors.emailRequired"),
      invalidCode: t("errors.invalidCode"),
      codeExpired: t("errors.codeExpired"),
      rateLimit: t("errors.rateLimit"),
      generic: t("errors.generic"),
    } as const;

    return (
      errorMessagesByCode[code ?? "generic"] ?? errorMessagesByCode.generic
    );
  };

  const resendLabel = useMemo(() => {
    if (canResend) {
      return t("resend");
    }

    return t("resendCountdown", { seconds: cooldownSecondsLeft });
  }, [canResend, cooldownSecondsLeft, t]);

  const onVerifySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);

    if (!hasEmail) {
      setErrorMessage(t("errors.missingEmailContext"));
      return;
    }

    setIsVerifying(true);

    const result = await verifyEmailOtp({
      email,
      token: otp,
      locale,
    });

    setIsVerifying(false);

    if (!result.ok) {
      setErrorMessage(resolveServerError(result.error));
      return;
    }

    const nextPath = result.nextPath ?? `/${locale}`;
    router.push(nextPath);
    router.refresh();
  };

  const onResendClick = async () => {
    if (!canResend) {
      return;
    }

    setErrorMessage(null);

    if (!hasEmail) {
      toast.error(t("errors.missingEmailContext"));
      return;
    }

    setIsResending(true);

    const result = await resendEmailOtp({
      email,
      locale,
    });

    setIsResending(false);

    if (!result.ok) {
      toast.error(resolveServerError(result.error));
      return;
    }

    setCooldownSecondsLeft(RESEND_COOLDOWN_SECONDS);
    toast.success(t("resentSuccess"));
  };

  return (
    <form onSubmit={onVerifySubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="verify-otp">{t("otpLabel")}</FieldLabel>
          <FieldContent className="items-start">
            <InputOTP
              id="verify-otp"
              value={otp}
              onChange={setOtp}
              maxLength={OTP_LENGTH}
              pattern={REGEXP_ONLY_DIGITS}
              autoComplete="one-time-code"
              className="w-full justify-start"
              containerClassName="w-full justify-start"
              aria-invalid={Boolean(errorMessage)}
            >
              <InputOTPGroup className="w-full">
                <InputOTPSlot index={0} className="h-11 w-full flex-1" />
                <InputOTPSlot index={1} className="h-11 w-full flex-1" />
                <InputOTPSlot index={2} className="h-11 w-full flex-1" />
                <InputOTPSlot index={3} className="h-11 w-full flex-1" />
                <InputOTPSlot index={4} className="h-11 w-full flex-1" />
                <InputOTPSlot index={5} className="h-11 w-full flex-1" />
                <InputOTPSlot index={6} className="h-11 w-full flex-1" />
                <InputOTPSlot index={7} className="h-11 w-full flex-1" />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-muted-foreground text-xs">{t("otpHint")}</p>
          </FieldContent>
        </Field>
      </FieldGroup>

      <FieldError errors={errorMessage ? [{ message: errorMessage }] : []} />

      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full" disabled={isVerifyDisabled}>
          {isVerifying ? t("verifying") : t("submit")}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={!canResend || isResending || !email.trim()}
          onClick={onResendClick}
        >
          {isResending ? t("resending") : resendLabel}
        </Button>
      </div>
    </form>
  );
}

export default VerifyEmailForm;
