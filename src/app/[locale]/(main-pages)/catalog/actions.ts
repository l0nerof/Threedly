"use server";

import {
  CATALOG_PAGE_SIZE,
  catalogSortValues,
} from "@/src/business/constants/catalogConfig";
import type {
  CatalogModelsResult,
  CatalogSortValue,
} from "@/src/business/types/catalog";
import { resolveModelCoverImageUrl } from "@/src/business/utils/modelUpload";
import { createClient } from "@/src/business/utils/supabase/server";

const SORT_COLUMN: Record<
  CatalogSortValue,
  { column: string; ascending: boolean }[]
> = {
  curated: [
    { column: "is_featured", ascending: false },
    { column: "created_at", ascending: false },
  ],
  fresh: [{ column: "published_at", ascending: false }],
  downloads: [{ column: "download_count", ascending: false }],
};

type FetchCatalogModelsParams = {
  page: number;
  sort?: CatalogSortValue;
};

export async function fetchCatalogModels({
  page,
  sort = catalogSortValues[0],
}: FetchCatalogModelsParams): Promise<CatalogModelsResult> {
  const supabase = await createClient();

  const from = (page - 1) * CATALOG_PAGE_SIZE;
  const to = from + CATALOG_PAGE_SIZE - 1;

  let query = supabase
    .from("models")
    .select(
      "id, slug, title_ua, title_en, cover_image_path, minimum_plan, file_format, download_count, is_featured, published_at",
      { count: "exact" },
    )
    .eq("status", "published")
    .range(from, to);

  for (const { column, ascending } of SORT_COLUMN[sort]) {
    query = query.order(column, { ascending });
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    models:
      data?.map((model) => ({
        ...model,
        cover_image_path: resolveModelCoverImageUrl(model.cover_image_path),
      })) ?? [],
    totalCount: count ?? 0,
  };
}
