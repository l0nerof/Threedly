"use server";

import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";

type VerifyEmailActionInput = {
  email: string;
  token: string;
  locale: string;
};

type ResendOtpActionInput = {
  email: string;
  locale: string;
};

type ActionResult = {
  ok: boolean;
  error?:
    | "requiredFields"
    | "emailRequired"
    | "invalidCode"
    | "codeExpired"
    | "rateLimit"
    | "generic";
  nextPath?: string;
};

const sanitizeEmail = (email: string) => email.trim().toLowerCase();
const sanitizeToken = (token: string) => token.replace(/\s+/g, "");

const resolveOtpErrorCode = (message?: string): ActionResult["error"] => {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (
    normalizedMessage.includes("token has expired") ||
    normalizedMessage.includes("invalid or has expired")
  ) {
    return "codeExpired";
  }

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid token")
  ) {
    return "invalidCode";
  }

  if (normalizedMessage.includes("rate limit")) {
    return "rateLimit";
  }

  return "generic";
};

export async function verifyEmailOtp({
  email,
  token,
  locale,
}: VerifyEmailActionInput): Promise<ActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "generic" };
  }

  const normalizedEmail = sanitizeEmail(email);
  const normalizedToken = sanitizeToken(token);

  if (!normalizedEmail || !normalizedToken) {
    return { ok: false, error: "requiredFields" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: normalizedToken,
    type: "signup",
  });

  if (error) {
    return { ok: false, error: resolveOtpErrorCode(error.message) };
  }

  return { ok: true, nextPath: `/${locale}` };
}

export async function resendEmailOtp({
  email,
  locale,
}: ResendOtpActionInput): Promise<ActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "generic" };
  }

  const normalizedEmail = sanitizeEmail(email);

  if (!normalizedEmail) {
    return { ok: false, error: "emailRequired" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
  });

  if (error) {
    return { ok: false, error: resolveOtpErrorCode(error.message) };
  }

  return { ok: true };
}
