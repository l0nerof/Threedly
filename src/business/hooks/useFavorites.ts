"use client";

import {
  favoritesQueryKeys,
  fetchCurrentUserId,
  fetchFavoriteModelIds,
  fetchFollowedDesignerIds,
  setDesignerFollow,
  setModelFavorite,
} from "@/src/business/queries/favorites";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type FavoriteResourceState = {
  isAuthenticated: boolean;
  isFavorite: boolean;
  isPending: boolean;
  toggle: () => void;
};

type FollowResourceState = {
  isAuthenticated: boolean;
  isFollowing: boolean;
  isPending: boolean;
  toggle: () => void;
};

function useCurrentUserId() {
  return useQuery({
    queryFn: fetchCurrentUserId,
    queryKey: favoritesQueryKeys.currentUser(),
    staleTime: 60_000,
  });
}

export function useFavoriteModel(modelId: string): FavoriteResourceState {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUserId();
  const userId = currentUser.data;
  const favoriteModels = useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchFavoriteModelIds(userId ?? ""),
    queryKey: userId
      ? favoritesQueryKeys.modelFavorites(userId)
      : favoritesQueryKeys.modelFavorites("guest"),
  });
  const favoriteIds = favoriteModels.data ?? [];
  const isFavorite = favoriteIds.includes(modelId);
  const mutation = useMutation({
    mutationFn: () =>
      setModelFavorite({
        isFavorite: !isFavorite,
        modelId,
        userId: userId ?? "",
      }),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: favoritesQueryKeys.modelFavorites(userId),
        });
      }
    },
  });

  return {
    isAuthenticated: Boolean(userId),
    isFavorite,
    isPending:
      currentUser.isLoading || favoriteModels.isLoading || mutation.isPending,
    toggle: () => {
      if (!userId || mutation.isPending) {
        return;
      }

      mutation.mutate();
    },
  };
}

export function useFollowDesigner(designerId: string): FollowResourceState {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUserId();
  const userId = currentUser.data;
  const followedDesigners = useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchFollowedDesignerIds(userId ?? ""),
    queryKey: userId
      ? favoritesQueryKeys.followedDesigners(userId)
      : favoritesQueryKeys.followedDesigners("guest"),
  });
  const followedIds = followedDesigners.data ?? [];
  const isFollowing = followedIds.includes(designerId);
  const mutation = useMutation({
    mutationFn: () =>
      setDesignerFollow({
        designerId,
        isFollowing: !isFollowing,
        userId: userId ?? "",
      }),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: favoritesQueryKeys.followedDesigners(userId),
        });
      }
    },
  });

  return {
    isAuthenticated: Boolean(userId && userId !== designerId),
    isFollowing,
    isPending:
      currentUser.isLoading ||
      followedDesigners.isLoading ||
      mutation.isPending,
    toggle: () => {
      if (!userId || mutation.isPending || userId === designerId) {
        return;
      }

      mutation.mutate();
    },
  };
}
