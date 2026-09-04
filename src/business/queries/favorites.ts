"use client";

import { createClient } from "@/src/business/utils/supabase/client";

export const favoritesQueryKeys = {
  root: ["favorites"] as const,
  currentUser: () => [...favoritesQueryKeys.root, "current-user"] as const,
  followedDesigners: (userId: string) =>
    [...favoritesQueryKeys.root, "designer-follows", userId] as const,
  modelFavorites: (userId: string) =>
    [...favoritesQueryKeys.root, "models", userId] as const,
};

type SetModelFavoriteArgs = {
  isFavorite: boolean;
  modelId: string;
  userId: string;
};

type SetDesignerFollowArgs = {
  designerId: string;
  isFollowing: boolean;
  userId: string;
};

function throwIfSupabaseError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCurrentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  throwIfSupabaseError(error);

  return user?.id ?? null;
}

export async function fetchFavoriteModelIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("model_id")
    .eq("user_id", userId);

  throwIfSupabaseError(error);

  return data?.map((favorite) => favorite.model_id) ?? [];
}

export async function fetchFollowedDesignerIds(
  userId: string,
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("designer_follows")
    .select("designer_id")
    .eq("follower_id", userId);

  throwIfSupabaseError(error);

  return data?.map((follow) => follow.designer_id) ?? [];
}

export async function setModelFavorite({
  isFavorite,
  modelId,
  userId,
}: SetModelFavoriteArgs): Promise<void> {
  const supabase = createClient();

  if (isFavorite) {
    const { error } = await supabase.from("favorites").insert({
      model_id: modelId,
      user_id: userId,
    });

    throwIfSupabaseError(error);
    return;
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("model_id", modelId);

  throwIfSupabaseError(error);
}

export async function setDesignerFollow({
  designerId,
  isFollowing,
  userId,
}: SetDesignerFollowArgs): Promise<void> {
  const supabase = createClient();

  if (isFollowing) {
    const { error } = await supabase.from("designer_follows").insert({
      designer_id: designerId,
      follower_id: userId,
    });

    throwIfSupabaseError(error);
    return;
  }

  const { error } = await supabase
    .from("designer_follows")
    .delete()
    .eq("follower_id", userId)
    .eq("designer_id", designerId);

  throwIfSupabaseError(error);
}
