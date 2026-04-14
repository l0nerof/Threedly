"use server";

import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import { headers } from "next/headers";

type ForgotPasswordActionInput = {
  email: string;
  locale: string;
};

type ActionResult = {
  ok: boolean;
  error?: "emailRequired" | "rateLimit" | "generic";
};

const sanitizeEmail = (email: string) => email.trim().toLowerCase();

const resolveOrigin = async () => {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : null;
};

const resolveForgotPasswordErrorCode = (
  message?: string,
): ActionResult["error"] => {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("rate limit")) {
    return "rateLimit";
  }

  return "generic";
};

export async function sendPasswordResetEmail({
  email,
  locale,
}: ForgotPasswordActionInput): Promise<ActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "generic" };
  }

  const normalizedEmail = sanitizeEmail(email);

  if (!normalizedEmail) {
    return { ok: false, error: "emailRequired" };
  }

  const origin = await resolveOrigin();

  if (!origin) {
    return { ok: false, error: "generic" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${origin}/${locale}/reset-password`,
  });

  if (error) {
    return { ok: false, error: resolveForgotPasswordErrorCode(error.message) };
  }

  return { ok: true };
}
