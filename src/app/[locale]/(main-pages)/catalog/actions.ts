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

type FilterParams = {
  search?: string;
  groups?: string[];
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
  groups,
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

  const categoryIds = await resolveCategoryIds({
    categories,
    groups,
    supabase,
  });

  if (categoryIds) {
    if (categoryIds.length === 0) {
      return { models: [], totalCount: 0 };
    }

    query = query.in("category_id", categoryIds);
  }

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

export async function fetchCatalogModelsCount({
  search,
  groups,
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

  const categoryIds = await resolveCategoryIds({
    categories,
    groups,
    supabase,
  });

  if (categoryIds) {
    if (categoryIds.length === 0) {
      return 0;
    }

    query = query.in("category_id", categoryIds);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

type CatalogSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function resolveCategoryIds({
  categories,
  groups,
  supabase,
}: Pick<FilterParams, "categories" | "groups"> & {
  supabase: CatalogSupabaseClient;
}): Promise<string[] | null> {
  if (categories && categories.length > 0) {
    const { data: categoryRows, error } = await supabase
      .from("categories")
      .select("id")
      .in("slug", categories);

    if (error) {
      throw new Error(error.message);
    }

    return categoryRows?.map((row) => row.id) ?? [];
  }

  if (groups && groups.length > 0) {
    const { data: groupRows, error: groupError } = await supabase
      .from("category_groups")
      .select("id")
      .in("slug", groups);

    if (groupError) {
      throw new Error(groupError.message);
    }

    const groupIds = groupRows?.map((row) => row.id) ?? [];

    if (groupIds.length === 0) {
      return [];
    }

    const { data: categoryRows, error } = await supabase
      .from("categories")
      .select("id")
      .in("group_id", groupIds);

    if (error) {
      throw new Error(error.message);
    }

    return categoryRows?.map((row) => row.id) ?? [];
  }

  return null;
}
