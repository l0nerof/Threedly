"use client";

import { fetchPublicationDraftsPageAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/draft-actions";
import { deletePublicationDraftAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/publication-actions";
import ModelsPagination from "@/src/business/components/ModelsPagination";
import { PUBLICATION_PAGE_SIZE } from "@/src/business/constants/modelPublication";
import { PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS } from "@/src/business/constants/modelPublicationEditor";
import { useFavoritesUser } from "@/src/business/hooks/useFavoritesSession";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import type { PublicationEditorError } from "@/src/business/types/modelPublicationEditor";
import { awaitPublicationRequest } from "@/src/business/utils/modelPublication";
import {
  PublicationEditorRequestError,
  publicationMutationData,
} from "@/src/business/utils/modelPublicationEditor";
import { Link } from "@/src/i18n/routing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/AlertDialog";
import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  ownerId: string;
  canUpload: boolean;
  result: Awaited<ReturnType<typeof fetchPublicationDraftsPageAction>>;
};
type Draft = Extract<Props["result"], { ok: true }>["data"]["drafts"][number];
type DraftState = {
  source: Props["result"];
  draft: Draft;
  error: PublicationEditorError;
  needsRecheck: boolean;
};

export default function PublicationDrafts(props: Props) {
  const identity = useFavoritesUser();
  const revision = useQuery({
    queryKey: favoritesQueryKeys.sessionRevision(),
    queryFn: () => 0,
    enabled: false,
    initialData: 0,
  }).data;
  if (identity.data !== props.ownerId || identity.isError) return null;
  return (
    <DraftList
      key={`${props.ownerId}:${revision}`}
      {...props}
      sessionRevision={revision}
      checkingSession={identity.isFetching}
    />
  );
}

function DraftList({
  ownerId,
  canUpload,
  result,
  sessionRevision,
  checkingSession,
}: Props & { sessionRevision: number; checkingSession: boolean }) {
  const t = useTranslations("Profile.uploads.editor");
  const locale = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const id = useId();
  const [selected, setSelected] = useState<Draft | null>(null);
  const [state, setState] = useState<DraftState | null>(null);
  const [pending, setPending] = useState<"delete" | "recheck" | null>(null);
  const [deletedId, setDeletedId] = useState<string | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const operation = useRef<AbortController | null>(null);
  const currentState = state?.source === result ? state : null;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      operation.current?.abort();
    };
  }, []);

  function isCurrent() {
    return (
      mounted.current &&
      queryClient.getQueryData(favoritesQueryKeys.currentUser()) === ownerId &&
      (queryClient.getQueryData<number>(favoritesQueryKeys.sessionRevision()) ??
        0) === sessionRevision
    );
  }

  async function request<T>(task: () => PromiseLike<T>): Promise<T> {
    if (!isCurrent())
      throw new PublicationEditorRequestError("session_changed");
    const controller = new AbortController();
    operation.current = controller;
    const timer = setTimeout(
      () => controller.abort(),
      PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS,
    );
    try {
      const response = await awaitPublicationRequest(task(), controller.signal);
      if (!isCurrent())
        throw new PublicationEditorRequestError("session_changed");
      return response;
    } catch (error) {
      if (controller.signal.aborted)
        throw new PublicationEditorRequestError("timeout");
      throw error;
    } finally {
      clearTimeout(timer);
      operation.current = null;
    }
  }

  async function removeDraft() {
    if (!selected || inFlight.current || checkingSession || !isCurrent())
      return;
    const draft = selected;
    inFlight.current = true;
    setPending("delete");
    try {
      const removed = publicationMutationData(
        await request(() =>
          deletePublicationDraftAction({
            draftId: draft.id,
            revision: draft.revision,
            confirmed: true,
          }),
        ),
        draft.id,
      );
      if (removed.lifecycle !== null)
        throw new PublicationEditorRequestError("cleanup_incomplete");
      setState(null);
      setSelected(null);
      setDeletedId(draft.id);
      router.refresh();
    } catch (error) {
      if (!isCurrent()) return;
      const code =
        error instanceof PublicationEditorRequestError ? error.code : "generic";
      setSelected(null);
      setState({
        source: result,
        draft,
        error: code,
        needsRecheck: code !== "cleanup_incomplete",
      });
    } finally {
      inFlight.current = false;
      if (isCurrent()) setPending(null);
    }
  }

  async function recheckDraft() {
    if (!currentState || inFlight.current || checkingSession || !isCurrent())
      return;
    const draft = currentState.draft;
    inFlight.current = true;
    setPending("recheck");
    try {
      const response = await request(() =>
        fetchPublicationDraftsPageAction({
          page: result.ok ? result.data.currentPage : 1,
        }),
      );
      if (!response.ok) throw new PublicationEditorRequestError(response.error);
      if (response.data.drafts.some((entry) => entry.creator_id !== ownerId))
        throw new PublicationEditorRequestError("session_changed");
      const observed = response.data.drafts.find(
        (entry) => entry.id === draft.id,
      );
      if (!observed) {
        router.refresh();
        return;
      }
      setState({
        source: result,
        draft: observed,
        error: currentState.error,
        needsRecheck: false,
      });
    } catch {
      if (isCurrent()) setState({ ...currentState, needsRecheck: true });
    } finally {
      inFlight.current = false;
      if (isCurrent()) setPending(null);
    }
  }

  return (
    <Card className="bg-surface/80 gap-4 rounded-3xl p-6">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3 p-0">
        <div className="space-y-2">
          <CardTitle>
            <h2>{t("draftsTitle")}</h2>
          </CardTitle>
          <CardDescription>{t("draftsDescription")}</CardDescription>
        </div>
        {canUpload ? (
          <Button asChild>
            <Link href="/profile/uploads/new">
              <Plus aria-hidden />
              {t("create")}
            </Link>
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noUploadAccess")}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {deletedId && <p role="status">{t("draftList.deleted")}</p>}
        {!result.ok ? (
          <div className="space-y-3">
            <p role="alert" className="text-destructive text-sm">
              {t(`errors.${result.error}`)}
            </p>
            <Button variant="outline" onClick={() => router.refresh()}>
              {t("retry")}
            </Button>
          </div>
        ) : result.data.drafts.length ? (
          <>
            <div className="divide-y">
              {result.data.drafts.map((entry) => {
                const draft =
                  currentState?.draft.id === entry.id
                    ? currentState.draft
                    : entry;
                const failed = currentState?.draft.id === draft.id;
                return (
                  <article
                    key={draft.id}
                    aria-labelledby={`${id}-${draft.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <h3
                        id={`${id}-${draft.id}`}
                        className="font-medium break-words"
                      >
                        {(locale === "ua" ? draft.title_ua : draft.title_en) ||
                          t("untitled")}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        {new Intl.DateTimeFormat(
                          locale === "ua" ? "uk-UA" : "en-US",
                          { dateStyle: "medium" },
                        ).format(new Date(draft.updated_at))}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {t(`lifecycle.${draft.lifecycle}`)}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/profile/uploads/${draft.id}`}>
                          {t("open")}
                        </Link>
                      </Button>
                      {failed && currentState.needsRecheck ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!pending || checkingSession}
                          onClick={() => void recheckDraft()}
                        >
                          {t("draftList.recheck")}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={
                            !!pending ||
                            checkingSession ||
                            deletedId === draft.id
                          }
                          onClick={() => setSelected(draft)}
                        >
                          <Trash2 aria-hidden />
                          {t(
                            draft.lifecycle === "deleting" || failed
                              ? "draftList.retryDelete"
                              : "delete",
                          )}
                        </Button>
                      )}
                    </div>
                    {failed && (
                      <p
                        role="alert"
                        className="text-destructive w-full text-sm"
                      >
                        {t(
                          currentState.error === "cleanup_incomplete"
                            ? "draftList.deleteIncomplete"
                            : currentState.error === "conflict"
                              ? "draftList.deleteConflict"
                              : "draftList.deleteFailed",
                        )}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
            <ModelsPagination
              currentPage={result.data.currentPage}
              totalPages={result.data.totalPages}
              previousPageLabel={t("previousDrafts")}
              nextPageLabel={t("nextDrafts")}
              pageOfLabel={t("draftCount", {
                from: (result.data.currentPage - 1) * PUBLICATION_PAGE_SIZE + 1,
                to: Math.min(
                  result.data.currentPage * PUBLICATION_PAGE_SIZE,
                  result.data.totalCount,
                ),
                total: result.data.totalCount,
              })}
              onPageChange={(page) => {
                const params = new URLSearchParams(search.toString());
                if (page === 1) params.delete("draftPage");
                else params.set("draftPage", String(page));
                router.push(`?${params.toString()}`, { scroll: false });
              }}
            />
          </>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noDrafts")}</p>
        )}
      </CardContent>
      {pending && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <LoaderCircle
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden
          />
          {t(pending === "delete" ? "pending.delete" : "pending.reload")}
        </p>
      )}
      <AlertDialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open && !inFlight.current) setSelected(null);
        }}
      >
        <AlertDialogContent
          onEscapeKeyDown={(event) => {
            if (inFlight.current) event.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.delete.description")}
            </AlertDialogDescription>
            {selected && (
              <p className="font-medium break-words">
                {(locale === "ua" ? selected.title_ua : selected.title_en) ||
                  t("untitled")}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!pending}>
              {t("stay")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!!pending || checkingSession}
              onClick={(event) => {
                event.preventDefault();
                void removeDraft();
              }}
            >
              {t("confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
