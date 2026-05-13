import type { CatalogModel } from "@/src/business/types/catalog";
import { resolveModelCoverImageUrl } from "@/src/business/utils/modelUpload";
import { createClient } from "@/src/business/utils/supabase/server";

const FEATURED_LIMIT = 10;

export async function fetchFeaturedModels(): Promise<CatalogModel[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("models")
    .select(
      "id, slug, title_ua, title_en, description_ua, description_en, cover_image_path, minimum_plan, file_format, download_count, is_featured, published_at",
    )
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(FEATURED_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((model) => ({
    ...model,
    cover_image_path: resolveModelCoverImageUrl(model.cover_image_path),
  }));
}
