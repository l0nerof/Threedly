"use client";

import {
  deleteOwnedModelAction,
  fetchOwnedModelAction,
  setOwnedModelPublicationAction,
  updateOwnedModelAction,
} from "@/src/app/[locale]/(main-pages)/profile/uploads/management-actions";
import { modelManagementMutationKey } from "@/src/business/constants/modelManagement";
import { useFavoritesUser } from "@/src/business/hooks/useFavoritesSession";
import { catalogQueryKeys } from "@/src/business/queries/catalog";
import { designersQueryKeys } from "@/src/business/queries/designers";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import {
  modelManagementResultSchema,
  ownedModelReadResultSchema,
} from "@/src/business/schemas/modelManagement";
import type {
  ModelManagementError,
  ModelManagementIntent,
  ModelManagementResult,
  OwnedModel,
  OwnedModelReadResult,
} from "@/src/business/types/modelManagement";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

type ViewState = {
  revision: number;
  observed: OwnedModel | null;
  gone: boolean;
  needsRecheck: boolean;
  lastError: ModelManagementError | null;
  rechecking: boolean;
};
const emptyView = (revision: number): ViewState => ({
  revision,
  observed: null,
  gone: false,
  needsRecheck: false,
  lastError: null,
  rechecking: false,
});

export function useModelManagement(ownerId: string, modelId: string) {
  const locale = useLocale();
  const t = useTranslations("Profile.uploads.management");
  const router = useRouter();
  const queryClient = useQueryClient();
  const identity = useFavoritesUser();
  const revision = useQuery({
    queryKey: favoritesQueryKeys.sessionRevision(),
    queryFn: () => 0,
    enabled: false,
    initialData: 0,
  }).data;
  const mutationKey = modelManagementMutationKey(ownerId, modelId);
  const sharedPending = useIsMutating({ mutationKey, exact: true }) > 0;
  const inFlight = useRef(false);
  const [view, setView] = useState(() => emptyView(revision));
  const { observed, gone, needsRecheck, lastError, rechecking } =
    view.revision === revision ? view : emptyView(revision);
  const patchView = useCallback(
    (expectedRevision: number, patch: Partial<Omit<ViewState, "revision">>) => {
      setView((previous) => ({
        ...(previous.revision === expectedRevision
          ? previous
          : emptyView(expectedRevision)),
        ...patch,
      }));
    },
    [],
  );
  const currentRevision = useCallback(
    () =>
      queryClient.getQueryData<number>(favoritesQueryKeys.sessionRevision()) ??
      0,
    [queryClient],
  );
  const isCurrent = useCallback(
    (expectedRevision: number) =>
      queryClient.getQueryData<string | null>(
        favoritesQueryKeys.currentUser(),
      ) === ownerId && currentRevision() === expectedRevision,
    [currentRevision, ownerId, queryClient],
  );

  const read = useCallback(async (): Promise<OwnedModelReadResult> => {
    const expectedRevision = currentRevision();
    if (!isCurrent(expectedRevision))
      return { ok: false, error: "session_changed" };
    let result: OwnedModelReadResult;
    try {
      const parsed = ownedModelReadResultSchema.safeParse(
        await fetchOwnedModelAction({ modelId }),
      );
      result = parsed.success ? parsed.data : { ok: false, error: "generic" };
    } catch {
      result = { ok: false, error: "generic" };
    }
    if (!isCurrent(expectedRevision))
      return { ok: false, error: "session_changed" };
    if (
      result.ok &&
      (result.model.id !== modelId || result.model.creator_id !== ownerId)
    )
      return { ok: false, error: "generic" };
    return result;
  }, [currentRevision, isCurrent, modelId, ownerId]);

  const reconcile = useCallback(
    async (expectedRevision: number) => {
      if (!isCurrent(expectedRevision)) return;
      const result = await read();
      if (!isCurrent(expectedRevision)) return;
      if (result.ok)
        patchView(expectedRevision, {
          observed: result.model,
          needsRecheck: false,
        });
      else if (result.error === "model_unavailable")
        patchView(expectedRevision, { gone: true, needsRecheck: false });
      else patchView(expectedRevision, { needsRecheck: true });
    },
    [isCurrent, patchView, read],
  );

  const refresh = useCallback(
    async (expectedRevision: number) => {
      if (!isCurrent(expectedRevision)) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: designersQueryKeys.root }),
        queryClient.invalidateQueries({
          queryKey: favoritesQueryKeys.modelFavorites(ownerId),
          exact: true,
        }),
      ]);
      if (isCurrent(expectedRevision)) router.refresh();
    },
    [isCurrent, ownerId, queryClient, router],
  );

  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: async ({
      intent,
      sessionRevision,
    }: {
      intent: ModelManagementIntent;
      sessionRevision: number;
    }): Promise<ModelManagementResult> => {
      if (!isCurrent(sessionRevision))
        return { ok: false, error: "session_changed" };
      try {
        const response =
          intent.type === "update"
            ? await updateOwnedModelAction(locale, {
                modelId,
                metadata: intent.metadata,
              })
            : intent.type === "delete"
              ? await deleteOwnedModelAction(locale, {
                  modelId,
                  confirmed: true,
                })
              : await setOwnedModelPublicationAction(locale, {
                  modelId,
                  status: intent.type === "publish" ? "published" : "archived",
                });
        const parsed = modelManagementResultSchema.safeParse(response);
        if (
          !parsed.success ||
          (parsed.data.ok && parsed.data.modelId !== modelId)
        )
          return { ok: false, error: "generic" };
        return parsed.data;
      } catch {
        return { ok: false, error: "generic" };
      }
    },
    onSuccess: async (result, { intent, sessionRevision }) => {
      if (!isCurrent(sessionRevision)) return;
      if (result.ok) {
        patchView(sessionRevision, { lastError: null });
        toast.success(t(`success.${intent.type}`));
        if (intent.type === "delete")
          patchView(sessionRevision, { gone: true });
        else await reconcile(sessionRevision);
      } else {
        patchView(sessionRevision, { lastError: result.error });
        toast.error(t(`errors.${result.error}`));
        await reconcile(sessionRevision);
        if (
          isCurrent(sessionRevision) &&
          (result.error === "unauthorized" ||
            result.error === "session_changed")
        )
          void queryClient.invalidateQueries({
            queryKey: favoritesQueryKeys.currentUser(),
            exact: true,
          });
      }
      await refresh(sessionRevision);
    },
  });

  const identityMatches = identity.data === ownerId && !identity.isError;
  const canAct =
    identityMatches && !identity.isFetching && !needsRecheck && !gone;
  const run = async (
    intent: ModelManagementIntent,
  ): Promise<ModelManagementResult | null> => {
    const sessionRevision = currentRevision();
    if (!canAct || !isCurrent(sessionRevision))
      return { ok: false, error: "session_changed" };
    if (
      inFlight.current ||
      queryClient.isMutating({ mutationKey, exact: true })
    )
      return null;
    inFlight.current = true;
    try {
      const result = await mutation.mutateAsync({ intent, sessionRevision });
      return isCurrent(sessionRevision)
        ? result
        : { ok: false, error: "session_changed" };
    } finally {
      inFlight.current = false;
    }
  };
  const recheck = async () => {
    const sessionRevision = currentRevision();
    if (sharedPending || inFlight.current || !isCurrent(sessionRevision))
      return;
    inFlight.current = true;
    patchView(sessionRevision, { rechecking: true });
    try {
      await reconcile(sessionRevision);
      await refresh(sessionRevision);
    } finally {
      inFlight.current = false;
      if (isCurrent(sessionRevision))
        patchView(sessionRevision, { rechecking: false });
    }
  };
  return {
    run,
    read,
    recheck,
    retrySession: () => identity.refetch(),
    observed,
    gone,
    lastError,
    needsRecheck,
    canAct,
    identityMatches,
    checkingSession: identity.isPending || identity.isFetching,
    scopeKey: `${identity.data ?? "guest"}:${revision}`,
    isPending: mutation.isPending || sharedPending || rechecking,
    pendingIntent: mutation.variables?.intent.type,
  };
}
