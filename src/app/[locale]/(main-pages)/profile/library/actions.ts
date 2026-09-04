"use server";

import type { CatalogModel } from "@/src/business/types/catalog";
import type { Tables } from "@/src/business/types/database.generated";
import type { Designer } from "@/src/business/types/designer";
import { resolveModelCoverImageUrl } from "@/src/business/utils/modelUpload";
import { createClient } from "@/src/business/utils/supabase/server";
import { resolveAvatarPublicUrl } from "@/src/business/utils/supabase/storage";

const PROFILE_LIBRARY_LIMIT = 24;

const PROFILE_LIBRARY_MODEL_SELECT =
  "id, slug, title_ua, title_en, description_ua, description_en, cover_image_path, minimum_plan, file_format, download_count, is_featured, published_at";

export type ProfileLibraryData = {
  downloadedModels: CatalogModel[];
  favoriteModels: CatalogModel[];
  followedDesigners: Designer[];
};

type LibraryModelJoinRow = {
  model: CatalogModel | null;
};

type FollowedDesignerRow = Pick<
  Tables<"profiles">,
  "avatar_path" | "bio" | "created_at" | "id" | "plan_key" | "username"
>;

type DesignerFollowJoinRow = {
  designer: FollowedDesignerRow | null;
};

type ModelCountRow = Pick<Tables<"models">, "creator_id">;

type SupabaseError = {
  message: string;
};

function throwIfError(error: SupabaseError | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

function mapModelJoinRows(rows: LibraryModelJoinRow[] | null): CatalogModel[] {
  return (rows ?? []).flatMap(({ model }) => {
    if (!model) {
      return [];
    }

    return [
      {
        ...model,
        cover_image_path: resolveModelCoverImageUrl(model.cover_image_path),
      },
    ];
  });
}

function countModelsByDesigner(rows: ModelCountRow[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (!row.creator_id) {
      continue;
    }

    counts.set(row.creator_id, (counts.get(row.creator_id) ?? 0) + 1);
  }

  return counts;
}

async function fetchDesignerModelCounts(
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

  throwIfError(error);

  return countModelsByDesigner((data ?? []) as ModelCountRow[]);
}

function mapFollowedDesigners(
  rows: DesignerFollowJoinRow[] | null,
  modelCounts: Map<string, number>,
): Designer[] {
  return (rows ?? []).flatMap(({ designer }) => {
    if (!designer) {
      return [];
    }

    return [
      {
        ...designer,
        avatar_path: resolveAvatarPublicUrl(designer.avatar_path),
        model_count: modelCounts.get(designer.id) ?? 0,
      },
    ];
  });
}

export async function fetchProfileLibraryData(): Promise<ProfileLibraryData | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  throwIfError(userError);

  if (!user) {
    return null;
  }

  const [
    downloadedModelsResult,
    favoriteModelsResult,
    followedDesignersResult,
  ] = await Promise.all([
    supabase
      .from("downloads")
      .select(
        `model:models!downloads_model_id_fkey(${PROFILE_LIBRARY_MODEL_SELECT})`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PROFILE_LIBRARY_LIMIT),
    supabase
      .from("favorites")
      .select(
        `model:models!favorites_model_id_fkey(${PROFILE_LIBRARY_MODEL_SELECT})`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PROFILE_LIBRARY_LIMIT),
    supabase
      .from("designer_follows")
      .select(
        "designer:profiles!designer_follows_designer_id_fkey(id, username, bio, avatar_path, plan_key, created_at)",
      )
      .eq("follower_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PROFILE_LIBRARY_LIMIT),
  ]);

  throwIfError(downloadedModelsResult.error);
  throwIfError(favoriteModelsResult.error);
  throwIfError(followedDesignersResult.error);

  const followedRows = (followedDesignersResult.data ??
    []) as DesignerFollowJoinRow[];
  const followedDesignerIds = followedRows.flatMap(({ designer }) =>
    designer ? [designer.id] : [],
  );
  const designerModelCounts = await fetchDesignerModelCounts(
    supabase,
    followedDesignerIds,
  );

  return {
    downloadedModels: mapModelJoinRows(
      downloadedModelsResult.data as LibraryModelJoinRow[] | null,
    ),
    favoriteModels: mapModelJoinRows(
      favoriteModelsResult.data as LibraryModelJoinRow[] | null,
    ),
    followedDesigners: mapFollowedDesigners(followedRows, designerModelCounts),
  };
}
