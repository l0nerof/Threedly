"use server";

import { LocaleCode } from "@/src/business/constants/localization";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOutAction(locale: string) {
  if (!isLocaleCode(locale)) {
    redirect(`/${LocaleCode.Ukrainian}/login`);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect(`/${locale}/login`);
}

export type UpdateProfileActionResult = {
  ok: boolean;
  error?: "invalidLocale" | "usernameRequired" | "unauthorized" | "generic";
};

export async function updateProfileAction(
  locale: string,
  formData: FormData,
): Promise<UpdateProfileActionResult> {
  if (!isLocaleCode(locale)) {
    return { ok: false, error: "invalidLocale" };
  }

  const usernameValue = formData.get("username");
  const bioValue = formData.get("bio");

  const username =
    typeof usernameValue === "string" ? usernameValue.trim().toLowerCase() : "";
  const bio = typeof bioValue === "string" ? bioValue.trim() : "";

  if (!username) {
    return { ok: false, error: "usernameRequired" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      bio,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "generic" };
  }

  revalidatePath(`/${locale}/profile/settings`);
  return { ok: true };
}
