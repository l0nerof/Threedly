import { createClient } from "@/src/business/utils/supabase/server";
import HeaderClient, { Category } from "../Header";

async function HeaderWrapper() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("slug, name_ua, name_en");

  const categories: Category[] = data ?? [];

  return <HeaderClient categories={categories} />;
}

export default HeaderWrapper;
