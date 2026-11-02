"use client";

import { FAVORITES_USER_STALE_TIME_MS } from "@/src/business/constants/favorites";
import {
  favoritesQueryKeys,
  fetchCurrentUserId,
} from "@/src/business/queries/favorites";
import { favoriteUserSchema } from "@/src/business/schemas/favorites";
import { createClient } from "@/src/business/utils/supabase/client";
import { type Query, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

function isPrivateFavoriteList(query: Query) {
  return (
    query.queryKey[0] === favoritesQueryKeys.root[0] &&
    (query.queryKey[1] === "models" || query.queryKey[1] === "designer-follows")
  );
}

export function useFavoritesUser() {
  return useQuery({
    queryKey: favoritesQueryKeys.currentUser(),
    queryFn: ({ signal }) => fetchCurrentUserId(signal),
    staleTime: FAVORITES_USER_STALE_TIME_MS,
    retry: false,
  });
}

export function useFavoritesSession() {
  const queryClient = useQueryClient();
  const currentUser = useFavoritesUser();
  const pathname = usePathname();
  const router = useRouter();
  const previousUser = useRef<string | null | undefined>(undefined);
  const previousPath = useRef<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyIdentity = useCallback(
    (userId: string | null, fromEvent: boolean) => {
      const previous = previousUser.current;
      if (previous === userId) return;
      previousUser.current = userId;
      const isPreviousList = (query: Query) =>
        isPrivateFavoriteList(query) && query.queryKey[2] !== userId;
      void queryClient.cancelQueries({ predicate: isPreviousList });
      queryClient.removeQueries({ predicate: isPreviousList });
      queryClient.setQueryData<number>(
        favoritesQueryKeys.sessionRevision(),
        (revision = 0) => revision + 1,
      );
      if (fromEvent) {
        void queryClient.cancelQueries({
          queryKey: favoritesQueryKeys.currentUser(),
          exact: true,
        });
        queryClient.setQueryData(favoritesQueryKeys.currentUser(), userId);
      }
      if (previous !== undefined || fromEvent) {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => {
          refreshTimer.current = null;
          router.refresh();
        }, 0);
      }
    },
    [queryClient, router],
  );

  useEffect(() => {
    previousUser.current = queryClient.getQueryData<string | null>(
      favoritesQueryKeys.currentUser(),
    );
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" && previousUser.current === undefined)
        return;
      if (!session) {
        applyIdentity(null, true);
        return;
      }
      const user = favoriteUserSchema.safeParse(session.user);
      if (user.success) applyIdentity(user.data.id, true);
    });
    return () => {
      subscription.unsubscribe();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [applyIdentity, queryClient]);

  useEffect(() => {
    if (currentUser.isSuccess) applyIdentity(currentUser.data, false);
  }, [applyIdentity, currentUser.data, currentUser.isSuccess]);

  useEffect(() => {
    const changed =
      previousPath.current !== null && previousPath.current !== pathname;
    previousPath.current = pathname;
    if (changed)
      void queryClient.invalidateQueries({
        queryKey: favoritesQueryKeys.currentUser(),
        exact: true,
      });
  }, [pathname, queryClient]);
}
