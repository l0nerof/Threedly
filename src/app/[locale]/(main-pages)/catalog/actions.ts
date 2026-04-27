"use server";

import {
  CATALOG_PAGE_SIZE,
  catalogSortValues,
} from "@/src/business/constants/catalogConfig";
import type {
  CatalogFormatValue,
  CatalogModelsResult,
  CatalogPlanKey,
  CatalogSortValue,
} from "@/src/business/types/catalog";
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

type FilterParams = {
  search?: string;
  categories?: string[];
  plans?: CatalogPlanKey[];
  formats?: CatalogFormatValue[];
};

type FetchCatalogModelsParams = FilterParams & {
  page: number;
  sort?: CatalogSortValue;
};

export async function fetchCatalogModels({
  page,
  sort = catalogSortValues[0],
  search,
  categories,
  plans,
  formats,
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

  if (search) {
    const safeSearch = search.replace(/[,()]/g, " ").trim();
    if (safeSearch) {
      query = query.or(
        `title_ua.ilike.%${safeSearch}%,title_en.ilike.%${safeSearch}%`,
      );
    }
  }

  if (plans && plans.length > 0) {
    query = query.in("minimum_plan", plans);
  }

  if (formats && formats.length > 0) {
    query = query.in("file_format", formats);
  }

  if (categories && categories.length > 0) {
    const { data: categoryRows } = await supabase
      .from("categories")
      .select("id")
      .in("slug", categories);
    const categoryIds = categoryRows?.map((r) => r.id) ?? [];
    if (categoryIds.length > 0) {
      query = query.in("category_id", categoryIds);
    }
  }

  for (const { column, ascending } of SORT_COLUMN[sort]) {
    query = query.order(column, { ascending });
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    models: data ?? [],
    totalCount: count ?? 0,
  };
}

export async function fetchCatalogModelsCount({
  search,
  categories,
  plans,
  formats,
}: FilterParams): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("models")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (search) {
    const safeSearch = search.replace(/[,()]/g, " ").trim();
    if (safeSearch) {
      query = query.or(
        `title_ua.ilike.%${safeSearch}%,title_en.ilike.%${safeSearch}%`,
      );
    }
  }

  if (plans && plans.length > 0) {
    query = query.in("minimum_plan", plans);
  }

  if (formats && formats.length > 0) {
    query = query.in("file_format", formats);
  }

  if (categories && categories.length > 0) {
    const { data: categoryRows } = await supabase
      .from("categories")
      .select("id")
      .in("slug", categories);
    const categoryIds = categoryRows?.map((r) => r.id) ?? [];
    if (categoryIds.length > 0) {
      query = query.in("category_id", categoryIds);
    }
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
