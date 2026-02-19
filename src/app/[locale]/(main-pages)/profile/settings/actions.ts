"use server";

import { LocaleCode } from "@/src/business/constants/localization";
import { isLocaleCode } from "@/src/business/utils/isLocaleCode";
import { createClient } from "@/src/business/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signOutAction(locale: string) {
  if (!isLocaleCode(locale)) {
    redirect(`/${LocaleCode.Ukrainian}/login`);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect(`/${locale}/login`);
}
