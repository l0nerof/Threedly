"use server";

import { DESIGNERS_PAGE_SIZE } from "@/src/business/constants/designersConfig";
import { DESIGNER_PROFILE_MODELS_LIMIT } from "@/src/business/constants/designersConfig";
import { LocaleCode } from "@/src/business/constants/localization";
import type { CatalogModel } from "@/src/business/types/catalog";
import type {
  Designer,
  DesignerCategoryGroupOption,
  DesignerLevel,
  DesignerSortValue,
  DesignersResult,
} from "@/src/business/types/designer";
import { resolveModelCoverImageUrl } from "@/src/business/utils/modelUpload";
import { createClient } from "@/src/business/utils/supabase/server";
import { resolveAvatarPublicUrl } from "@/src/business/utils/supabase/storage";

type FilterParams = {
  search?: string;
  groups?: string[];
  levels?: DesignerLevel[];
};

type BuildQueryParams = FilterParams & {
  designerIds?: string[];
};

type FetchDesignersParams = FilterParams & {
  page: number;
  sort?: DesignerSortValue;
};

type DesignerProfileResult = {
  designer: Designer;
  models: CatalogModel[];
};

type DesignerModelStats = {
  downloadCount: number;
  modelCount: number;
};

function buildQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  { search, levels, designerIds }: BuildQueryParams,
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

  if (designerIds && designerIds.length > 0) {
    query = query.in("id", designerIds);
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

function compareNewest(left: Designer, right: Designer): number {
  return (
    new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

function sortDesigners(
  designers: Designer[],
  sort: DesignerSortValue,
  modelStats: Map<string, DesignerModelStats>,
): Designer[] {
  return [...designers].sort((left, right) => {
    if (sort === "popular") {
      const downloadsDiff =
        (modelStats.get(right.id)?.downloadCount ?? 0) -
        (modelStats.get(left.id)?.downloadCount ?? 0);

      if (downloadsDiff !== 0) {
        return downloadsDiff;
      }
    }

    if (sort === "models") {
      const countDiff = right.model_count - left.model_count;

      if (countDiff !== 0) {
        return countDiff;
      }
    }

    return compareNewest(left, right);
  });
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

async function fetchPublishedModelStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  designerIds: string[],
): Promise<Map<string, DesignerModelStats>> {
  if (designerIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("models")
    .select("creator_id, download_count")
    .in("creator_id", designerIds)
    .eq("status", "published");

  if (error) {
    throw new Error(error.message);
  }

  const stats = new Map<string, DesignerModelStats>();

  for (const model of data ?? []) {
    if (!model.creator_id) {
      continue;
    }

    const current = stats.get(model.creator_id) ?? {
      downloadCount: 0,
      modelCount: 0,
    };

    stats.set(model.creator_id, {
      downloadCount: current.downloadCount + model.download_count,
      modelCount: current.modelCount + 1,
    });
  }

  return stats;
}

async function resolveDesignerIdsByGroups(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groups?: string[],
): Promise<string[] | null> {
  if (!groups || groups.length === 0) {
    return null;
  }

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

  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .in("group_id", groupIds);

  if (categoryError) {
    throw new Error(categoryError.message);
  }

  const categoryIds = categoryRows?.map((row) => row.id) ?? [];

  if (categoryIds.length === 0) {
    return [];
  }

  const { data: modelRows, error: modelsError } = await supabase
    .from("models")
    .select("creator_id")
    .in("category_id", categoryIds)
    .eq("status", "published");

  if (modelsError) {
    throw new Error(modelsError.message);
  }

  return Array.from(
    new Set(
      (modelRows ?? [])
        .map((model) => model.creator_id)
        .filter((creatorId): creatorId is string => Boolean(creatorId)),
    ),
  );
}

export async function fetchDesigners({
  page,
  sort = "popular",
  groups,
  search,
  levels,
}: FetchDesignersParams): Promise<DesignersResult> {
  const supabase = await createClient();

  const designerIds = await resolveDesignerIdsByGroups(supabase, groups);

  if (designerIds && designerIds.length === 0) {
    return { designers: [], totalCount: 0 };
  }

  const from = (page - 1) * DESIGNERS_PAGE_SIZE;
  const to = from + DESIGNERS_PAGE_SIZE - 1;

  let query = buildQuery(supabase, {
    designerIds: designerIds ?? undefined,
    search,
    levels,
  });
  query = applySort(query, sort);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const designers = data?.map(mapRow) ?? [];
  const modelStats = await fetchPublishedModelStats(
    supabase,
    designers.map((designer) => designer.id),
  );

  const designersWithCounts = designers.map((designer) => ({
    ...designer,
    model_count: modelStats.get(designer.id)?.modelCount ?? 0,
  }));

  return {
    designers: sortDesigners(designersWithCounts, sort, modelStats).slice(
      from,
      to + 1,
    ),
    totalCount: count ?? 0,
  };
}

export async function fetchDesignersCount({
  groups,
  search,
  levels,
}: FilterParams): Promise<number> {
  const supabase = await createClient();

  const designerIds = await resolveDesignerIdsByGroups(supabase, groups);

  if (designerIds && designerIds.length === 0) {
    return 0;
  }

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

  if (designerIds && designerIds.length > 0) {
    query = query.in("id", designerIds);
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

export async function fetchDesignerCategoryGroups(
  locale: LocaleCode,
): Promise<DesignerCategoryGroupOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("category_groups")
    .select("slug, name_ua, name_en")
    .order("sort_order");

  if (error) throw new Error(error.message);

  return (data ?? []).map((group) => ({
    value: group.slug,
    label: locale === LocaleCode.Ukrainian ? group.name_ua : group.name_en,
  }));
}
