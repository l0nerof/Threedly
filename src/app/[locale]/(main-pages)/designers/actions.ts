"use server";

import { DESIGNERS_PAGE_SIZE } from "@/src/business/constants/designersConfig";
import type {
  Designer,
  DesignerLevel,
  DesignerSortValue,
  DesignersResult,
} from "@/src/business/types/designer";
import { createClient } from "@/src/business/utils/supabase/server";
import { resolveAvatarPublicUrl } from "@/src/business/utils/supabase/storage";

type FilterParams = {
  search?: string;
  levels?: DesignerLevel[];
};

type FetchDesignersParams = FilterParams & {
  page: number;
  sort?: DesignerSortValue;
};

function buildQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  { search, levels }: FilterParams,
) {
  let query = supabase
    .from("profiles")
    .select("id, username, bio, avatar_path, plan_key, created_at", {
      count: "exact",
    })
    .eq("can_upload", true);

  if (search) {
    const safe = search.replace(/[,()]/g, " ").trim();
    if (safe) {
      query = query.ilike("username", `%${safe}%`);
    }
  }

  if (levels && levels.length > 0) {
    query = query.in("plan_key", levels);
  }

  return query;
}

function applySort(
  query: ReturnType<typeof buildQuery>,
  sort: DesignerSortValue,
) {
  switch (sort) {
    case "newest":
      return query.order("created_at", { ascending: false });
    case "models":
    case "popular":
    default:
      return query.order("created_at", { ascending: false });
  }
}

function mapRow(row: {
  id: string;
  username: string;
  bio: string | null;
  avatar_path: string | null;
  plan_key: string;
  created_at: string;
}): Designer {
  return {
    id: row.id,
    username: row.username,
    bio: row.bio,
    avatar_path: resolveAvatarPublicUrl(row.avatar_path),
    plan_key: row.plan_key as Designer["plan_key"],
    model_count: 0,
    created_at: row.created_at,
  };
}

export async function fetchDesigners({
  page,
  sort = "popular",
  search,
  levels,
}: FetchDesignersParams): Promise<DesignersResult> {
  const supabase = await createClient();

  const from = (page - 1) * DESIGNERS_PAGE_SIZE;
  const to = from + DESIGNERS_PAGE_SIZE - 1;

  let query = buildQuery(supabase, {
    search,
    levels,
  });
  query = applySort(query, sort);
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    designers: data?.map(mapRow) ?? [],
    totalCount: count ?? 0,
  };
}

export async function fetchDesignersCount({
  search,
  levels,
}: FilterParams): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("can_upload", true);

  if (search) {
    const safe = search.replace(/[,()]/g, " ").trim();
    if (safe) {
      query = query.ilike("username", `%${safe}%`);
    }
  }

  if (levels && levels.length > 0) {
    query = query.in("plan_key", levels);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export type CategoryGroupOption = {
  slug: string;
  name_ua: string;
  name_en: string;
};

export async function fetchDesignerCategoryGroups(): Promise<
  CategoryGroupOption[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("category_groups")
    .select("slug, name_ua, name_en")
    .order("sort_order");

  if (error) throw new Error(error.message);

  return data ?? [];
}
