"use server";

import { createClient } from "@/business/utils/supabase/server";

export async function resendVerificationEmail(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
  });

  if (error) {
    throw new Error("Не вдалося надіслати лист підтвердження");
  }

  return { success: true };
}
