"use client";

import {
  FavoritesRequestError,
  favoritesQueryKeys,
  fetchFavoriteModelIds,
  fetchFollowedDesignerIds,
  getFavoritesErrorCode,
  setDesignerFollow,
  setModelFavorite,
} from "@/src/business/queries/favorites";
import type {
  FavoriteMutation,
  FavoriteResourceKind,
} from "@/src/business/types/favorites";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFavoritesUser } from "./useFavoritesSession";

function useSavedResource(kind: FavoriteResourceKind, targetId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations("Favorites");
  const currentUser = useFavoritesUser();
  const userId = currentUser.data;
  const isSelf = kind === "designer" && userId === targetId;
  const queryKey =
    kind === "model"
      ? favoritesQueryKeys.modelFavorites(userId ?? "guest")
      : favoritesQueryKeys.followedDesigners(userId ?? "guest");
  const resource = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      kind === "model"
        ? fetchFavoriteModelIds(userId ?? "", signal)
        : fetchFollowedDesignerIds(userId ?? "", signal),
    enabled: Boolean(
      userId && !isSelf && !currentUser.isError && !currentUser.isFetching,
    ),
    retry: false,
  });
  const mutationKey = favoritesQueryKeys.mutation(
    kind,
    userId ?? "guest",
    targetId,
  );
  const pendingMutations = useIsMutating({ mutationKey, exact: true });

  function isCurrentSession(variables: FavoriteMutation) {
    return (
      queryClient.getQueryData(favoritesQueryKeys.currentUser()) ===
        variables.userId &&
      (queryClient.getQueryData<number>(favoritesQueryKeys.sessionRevision()) ??
        0) === variables.revision
    );
  }

  function ownerQueryKey(ownerId: string) {
    return kind === "model"
      ? favoritesQueryKeys.modelFavorites(ownerId)
      : favoritesQueryKeys.followedDesigners(ownerId);
  }

  async function reconcileOwner(
    variables: FavoriteMutation,
    allowNewSession = false,
  ) {
    const isOwner = () =>
      queryClient.getQueryData(favoritesQueryKeys.currentUser()) ===
        variables.userId &&
      (allowNewSession || isCurrentSession(variables));
    if (!isOwner()) return;
    const key = ownerQueryKey(variables.userId);
    await queryClient.invalidateQueries({ queryKey: key, exact: true });
    if (isOwner() && queryClient.getQueryState(key)?.status === "success")
      router.refresh();
  }

  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: (variables: FavoriteMutation) => {
      if (!isCurrentSession(variables))
        return Promise.reject(new FavoritesRequestError("sessionChanged"));
      return kind === "model"
        ? setModelFavorite({
            userId: variables.userId,
            modelId: variables.targetId,
            isFavorite: variables.selected,
          })
        : setDesignerFollow({
            userId: variables.userId,
            designerId: variables.targetId,
            isFollowing: variables.selected,
          });
    },
    onSuccess: async (_data, variables) => {
      if (!isCurrentSession(variables)) return reconcileOwner(variables, true);
      const key = ownerQueryKey(variables.userId);
      await queryClient.cancelQueries({ queryKey: key, exact: true });
      if (!isCurrentSession(variables)) return;
      queryClient.setQueryData<string[]>(key, (ids) =>
        ids
          ? variables.selected
            ? [...new Set([...ids, variables.targetId])].sort()
            : ids.filter((id) => id !== variables.targetId)
          : undefined,
      );
      await queryClient.invalidateQueries({ queryKey: key, exact: true });
      if (isCurrentSession(variables)) router.refresh();
    },
    onError: async (error, variables) => {
      if (!isCurrentSession(variables)) return reconcileOwner(variables, true);
      const code = getFavoritesErrorCode(error);
      toast.error(t(`errors.${code}`), {
        id: `favorites-${kind}-${variables.targetId}`,
      });
      if (code === "sessionChanged" || code === "unauthorized") {
        await queryClient.invalidateQueries({
          queryKey: favoritesQueryKeys.currentUser(),
          exact: true,
        });
        return;
      }
      await reconcileOwner(variables);
    },
  });

  const isReadError =
    !isSelf &&
    !currentUser.isFetching &&
    (currentUser.isError || resource.isError);
  const readError = currentUser.error ?? resource.error;
  const isPending =
    currentUser.isFetching || resource.isFetching || pendingMutations > 0;

  async function retry() {
    const needsAuthCheck =
      currentUser.isError ||
      ["sessionChanged", "unauthorized"].includes(
        getFavoritesErrorCode(readError),
      );
    const result = needsAuthCheck
      ? await currentUser.refetch()
      : await resource.refetch();
    if (result.isError)
      toast.error(t(`errors.${getFavoritesErrorCode(result.error)}`));
  }

  return {
    isAuthenticated: Boolean(userId && !isSelf && !currentUser.isFetching),
    isSelected: resource.data?.includes(targetId) ?? false,
    isPending,
    isReadError,
    readErrorCode: getFavoritesErrorCode(readError),
    retry,
    toggle: () => {
      if (
        !userId ||
        isSelf ||
        isPending ||
        isReadError ||
        !resource.isSuccess ||
        queryClient.getQueryData(favoritesQueryKeys.currentUser()) !== userId ||
        queryClient.getQueryState(queryKey)?.status !== "success" ||
        queryClient.isMutating({ mutationKey, exact: true }) > 0
      )
        return;
      mutation.mutate({
        userId,
        targetId,
        selected: !resource.data.includes(targetId),
        revision:
          queryClient.getQueryData<number>(
            favoritesQueryKeys.sessionRevision(),
          ) ?? 0,
      });
    },
  };
}

export function useFavoriteModel(modelId: string) {
  const resource = useSavedResource("model", modelId);
  return { ...resource, isFavorite: resource.isSelected };
}

export function useFollowDesigner(designerId: string) {
  const resource = useSavedResource("designer", designerId);
  return { ...resource, isFollowing: resource.isSelected };
}
