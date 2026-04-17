import { createClient } from "@/src/business/utils/supabase/server";
import Header from "../Header";

async function HeaderWrapper() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("slug, name_ua, name_en");

  return <Header categories={data ?? []} />;
}

export default HeaderWrapper;
