"use server";

import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import { headers } from "next/headers";

type SignupActionInput = {
  email: string;
  password: string;
  locale: string;
};

type ActionResult = {
  ok: boolean;
  error?: "alreadyRegistered" | "rateLimit" | "generic";
  nextPath?: string;
};

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

export async function signupWithEmailPassword({
  email,
  password,
  locale,
}: SignupActionInput): Promise<ActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "generic" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = await createClient();
  const origin = await resolveOrigin();
  const emailRedirectTo = origin
    ? `${origin}/${locale}/verify-email?email=${encodeURIComponent(normalizedEmail)}`
    : undefined;

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { ok: false, error: "alreadyRegistered" };
    }

    if (error.message.toLowerCase().includes("rate limit")) {
      return { ok: false, error: "rateLimit" };
    }

    return { ok: false, error: "generic" };
  }

  // Supabase can obfuscate duplicate signup attempts by returning user
  // with an empty identities array instead of explicit error.
  if (
    data?.user &&
    Array.isArray(data.user.identities) &&
    data.user.identities.length === 0
  ) {
    return { ok: false, error: "alreadyRegistered" };
  }

  return {
    ok: true,
    nextPath: `/${locale}/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
  };
}
