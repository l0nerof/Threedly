"use server";

import { DESIGNERS_PAGE_SIZE } from "@/src/business/constants/designersConfig";
import { DESIGNER_PROFILE_MODELS_LIMIT } from "@/src/business/constants/designersConfig";
import type { CatalogModel } from "@/src/business/types/catalog";
import type {
  Designer,
  DesignerLevel,
  DesignerSortValue,
  DesignersResult,
} from "@/src/business/types/designer";
import { resolveModelCoverImageUrl } from "@/src/business/utils/modelUpload";
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

type DesignerProfileResult = {
  designer: Designer;
  models: CatalogModel[];
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
  plan_key: DesignerLevel;
  created_at: string;
}): Designer {
  return {
    id: row.id,
    username: row.username,
    bio: row.bio,
    avatar_path: resolveAvatarPublicUrl(row.avatar_path),
    plan_key: row.plan_key,
    model_count: 0,
    created_at: row.created_at,
  };
}

function mapModelRow(model: CatalogModel): CatalogModel {
  return {
    ...model,
    cover_image_path: resolveModelCoverImageUrl(model.cover_image_path),
  };
}

async function fetchPublishedModelCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  designerIds: string[],
): Promise<Map<string, number>> {
  if (designerIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("models")
    .select("creator_id")
    .in("creator_id", designerIds)
    .eq("status", "published");

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();

  for (const model of data ?? []) {
    if (!model.creator_id) {
      continue;
    }

    counts.set(model.creator_id, (counts.get(model.creator_id) ?? 0) + 1);
  }

  return counts;
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

  const designers = data?.map(mapRow) ?? [];
  const modelCounts = await fetchPublishedModelCounts(
    supabase,
    designers.map((designer) => designer.id),
  );

  return {
    designers: designers.map((designer) => ({
      ...designer,
      model_count: modelCounts.get(designer.id) ?? 0,
    })),
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

export async function fetchDesignerProfileByUsername(
  username: string,
): Promise<DesignerProfileResult | null> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_path, plan_key, created_at")
    .eq("username", username)
    .eq("can_upload", true)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    return null;
  }

  const {
    data: models,
    count,
    error: modelsError,
  } = await supabase
    .from("models")
    .select(
      "id, slug, title_ua, title_en, description_ua, description_en, cover_image_path, minimum_plan, file_format, download_count, is_featured, published_at",
      { count: "exact" },
    )
    .eq("creator_id", profile.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(DESIGNER_PROFILE_MODELS_LIMIT);

  if (modelsError) {
    throw new Error(modelsError.message);
  }

  const mappedModels = models?.map(mapModelRow) ?? [];

  return {
    designer: {
      ...mapRow(profile),
      model_count: count ?? mappedModels.length,
    },
    models: mappedModels,
  };
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
