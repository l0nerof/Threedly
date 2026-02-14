"use server";

import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";

type LoginActionInput = {
  email: string;
  password: string;
  locale: string;
};

type ActionResult = {
  ok: boolean;
  error?: "invalidCredentials" | "emailNotConfirmed" | "generic";
  nextPath?: string;
};

const resolveLoginErrorCode = (message?: string): ActionResult["error"] => {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("invalid login credentials")) {
    return "invalidCredentials";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "emailNotConfirmed";
  }

  return "generic";
};

export async function loginWithEmailPassword({
  email,
  password,
  locale,
}: LoginActionInput): Promise<ActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "generic" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { ok: false, error: resolveLoginErrorCode(error.message) };
  }

  return { ok: true, nextPath: `/${locale}` };
}
