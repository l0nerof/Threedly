"use client";

import {
  attachPublicationAssetAction,
  createPublicationDraftAction,
  fetchPublicationDraftAction,
  reservePublicationAssetAction,
  savePublicationDraftAction,
} from "@/src/app/[locale]/(main-pages)/profile/uploads/draft-actions";
import {
  cancelPublicationDraftAction,
  cleanupPublicationDraftAction,
  deletePublicationDraftAction,
  publishPublicationDraftAction,
} from "@/src/app/[locale]/(main-pages)/profile/uploads/publication-actions";
import { PUBLICATION_UPLOAD_TIMEOUT_MS } from "@/src/business/constants/modelPublication";
import { PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS } from "@/src/business/constants/modelPublicationEditor";
import { useFavoritesUser } from "@/src/business/hooks/useFavoritesSession";
import { catalogQueryKeys } from "@/src/business/queries/catalog";
import { designersQueryKeys } from "@/src/business/queries/designers";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import { publicationMetadataSchema } from "@/src/business/schemas/modelPublication";
import type {
  PublicationEditorData,
  PublicationMetadata,
} from "@/src/business/types/modelPublication";
import type {
  PublicationEditorError,
  PublicationEditorFiles,
  PublicationEditorIntent,
  PublicationEditorProps,
} from "@/src/business/types/modelPublicationEditor";
import {
  awaitPublicationRequest,
  getPublicationManifest,
} from "@/src/business/utils/modelPublication";
import {
  PublicationEditorRequestError,
  publicationEditorData,
  publicationMetadata,
  publicationMutationData,
  publicationReadiness,
  samePublicationMetadata,
} from "@/src/business/utils/modelPublicationEditor";
import { uploadPublicationAsset } from "@/src/business/utils/modelPublicationUpload";
import { useRouter } from "@/src/i18n/routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigationGuard } from "nextjs-nav-guard";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";

export function usePublicationEditor(props: PublicationEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const identity = useFavoritesUser();
  const sessionRevision = useRef(
    queryClient.getQueryData<number>(favoritesQueryKeys.sessionRevision()) ?? 0,
  ).current;
  const [saved, setSaved] = useState(props.initial);
  const savedRef = useRef(saved);
  const draftId = useRef(props.initial?.draft.id ?? null);
  const [files, setFiles] = useState<PublicationEditorFiles>({
    source: null,
    cover: null,
  });
  const [pending, setPending] = useState<PublicationEditorIntent | null>(null);
  const [error, setError] = useState<PublicationEditorError | null>(null);
  const [notice, setNotice] = useState<
    "saved" | "published" | "cleaned" | "cancelled" | "partial" | null
  >(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [uploadDenied, setUploadDenied] = useState(false);
  const [gone, setGone] = useState(false);
  const [cleanupPending, setCleanupPending] = useState(
    props.initial?.cleanupPending ?? false,
  );
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const operation = useRef<AbortController | null>(null);
  const form = useForm<PublicationMetadata>({
    resolver: zodResolver(publicationMetadataSchema),
    defaultValues: publicationMetadata(props.initial),
  });
  const values = form.watch();
  const dirty =
    !gone &&
    (!samePublicationMetadata(values, publicationMetadata(saved)) ||
      !!files.source ||
      !!files.cover);
  const lifecycle = saved?.draft.lifecycle ?? "draft";
  const canUpload = props.canUpload && !uploadDenied;
  const editable =
    lifecycle === "draft" &&
    !gone &&
    !pending &&
    !needsReview &&
    !identity.isFetching;
  const readiness = publicationReadiness(
    values,
    files,
    saved,
    props.categoryGroups,
  );
  const ready = readiness.ready;
  const navigationGuard = useNavigationGuard({
    enabled: ({ type }) => type !== "refresh" && !gone && (dirty || !!pending),
  });

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
      queryClient.getQueryData(favoritesQueryKeys.currentUser()) ===
        props.ownerId &&
      (queryClient.getQueryData<number>(favoritesQueryKeys.sessionRevision()) ??
        0) === sessionRevision
    );
  }
  function assertCurrent() {
    if (!isCurrent())
      throw new PublicationEditorRequestError("session_changed");
  }
  function observe(data: PublicationEditorData) {
    assertCurrent();
    savedRef.current = data;
    setSaved(data);
    if (data.draft.lifecycle === "published")
      setCleanupPending(data.cleanupPending);
  }
  async function request<T>(
    task: () => PromiseLike<T>,
    timeout = PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS,
  ): Promise<T> {
    assertCurrent();
    const controller = new AbortController();
    const parent = operation.current?.signal;
    const abort = () => controller.abort();
    if (parent?.aborted)
      throw new PublicationEditorRequestError("session_changed");
    parent?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, timeout);
    try {
      const result = await awaitPublicationRequest(task(), controller.signal);
      assertCurrent();
      return result;
    } catch (failure) {
      assertCurrent();
      if (controller.signal.aborted)
        throw new PublicationEditorRequestError(
          parent?.aborted ? "session_changed" : "timeout",
        );
      throw failure;
    } finally {
      clearTimeout(timer);
      parent?.removeEventListener("abort", abort);
    }
  }
  async function read() {
    const id = draftId.current;
    if (!id) throw new PublicationEditorRequestError("draft_unavailable");
    return publicationEditorData(
      await request(() => fetchPublicationDraftAction({ draftId: id })),
      props.ownerId,
      id,
    );
  }
  async function mutate(task: () => PromiseLike<unknown>) {
    const id = draftId.current;
    if (!id) throw new PublicationEditorRequestError("draft_unavailable");
    return publicationMutationData(await request(task), id);
  }
  async function cleanup() {
    setCleanupPending(true);
    const result = await mutate(() =>
      cleanupPublicationDraftAction({ draftId: draftId.current }),
    );
    if (result.lifecycle === "published") {
      const data = await read();
      observe(data);
      if (data.cleanupPending)
        throw new PublicationEditorRequestError("cleanup_incomplete");
    } else setCleanupPending(false);
    return result;
  }
  function refreshPublished() {
    void queryClient.invalidateQueries({ queryKey: catalogQueryKeys.root });
    void queryClient.invalidateQueries({ queryKey: designersQueryKeys.root });
    router.refresh();
  }

  async function persist(metadata: PublicationMetadata) {
    if (!draftId.current) draftId.current = crypto.randomUUID();
    if (!savedRef.current) {
      await mutate(() =>
        createPublicationDraftAction({ draftId: draftId.current }),
      );
      const created = await read();
      observe(created);
      if (created.draft.revision !== 0 || created.draft.lifecycle !== "draft")
        throw new PublicationEditorRequestError("conflict");
    }
    const existing = savedRef.current;
    if (!existing || existing.draft.lifecycle !== "draft")
      throw new PublicationEditorRequestError("busy");
    let current = existing;
    if (!samePublicationMetadata(metadata, publicationMetadata(current))) {
      const result = await mutate(() =>
        savePublicationDraftAction({
          draftId: current.draft.id,
          revision: current.draft.revision,
          metadata,
        }),
      );
      if (
        result.lifecycle !== "draft" ||
        result.revision !== current.draft.revision + 1
      )
        throw new PublicationEditorRequestError("generic");
      current = {
        ...current,
        draft: {
          ...current.draft,
          revision: result.revision,
          title_ua: metadata.titleUa,
          title_en: metadata.titleEn,
          description_ua: metadata.descriptionUa,
          description_en: metadata.descriptionEn,
          category_id: metadata.categoryId,
          minimum_plan: metadata.minimumPlan,
        },
      };
      observe(current);
      form.reset(metadata);
      setNotice("partial");
    }
    let attached = false;
    for (const kind of ["source", "cover"] as const) {
      const file = files[kind];
      if (!file) continue;
      if (!canUpload)
        throw new PublicationEditorRequestError("upload_not_allowed");
      const row = publicationMutationData(
        await request(
          () =>
            uploadPublicationAsset({
              userId: props.ownerId,
              draftId: current.draft.id,
              revision: current.draft.revision,
              kind,
              file,
              signal: operation.current?.signal,
              reserve: reservePublicationAssetAction,
              attach: attachPublicationAssetAction,
            }),
          PUBLICATION_UPLOAD_TIMEOUT_MS + PUBLICATION_EDITOR_REQUEST_TIMEOUT_MS,
        ),
        current.draft.id,
      );
      if (
        row.lifecycle !== "draft" ||
        row.revision !== current.draft.revision + 1
      )
        throw new PublicationEditorRequestError("generic");
      current = {
        ...current,
        draft: { ...current.draft, revision: row.revision },
      };
      observe(current);
      setFiles((previous) => ({ ...previous, [kind]: null }));
      attached = true;
    }
    current = await read();
    observe(current);
    if (!samePublicationMetadata(metadata, publicationMetadata(current)))
      throw new PublicationEditorRequestError("conflict");
    form.reset(publicationMetadata(current));
    if (attached) await cleanup();
    return current;
  }
  async function run(intent: PublicationEditorIntent, discard = false) {
    if (inFlight.current || !isCurrent() || gone) return;
    if (
      (intent === "save" || intent === "publish") &&
      (needsReview || identity.isFetching)
    )
      return;
    if (intent === "save" && (!dirty || lifecycle !== "draft")) return;
    if (
      intent === "publish" &&
      (!canUpload ||
        (lifecycle === "draft" && !ready) ||
        !["draft", "publishing"].includes(lifecycle))
    )
      return;
    inFlight.current = true;
    operation.current = new AbortController();
    setPending(intent);
    setError(null);
    setNotice(null);
    try {
      if (intent === "reload") {
        const data = await read();
        const changed =
          data.draft.revision !== savedRef.current?.draft.revision;
        observe(data);
        if (discard) {
          form.reset(publicationMetadata(data));
          setFiles({ source: null, cover: null });
          setNeedsReview(false);
        } else if (changed) setNeedsReview(true);
        return;
      }
      if (intent === "save" || intent === "publish") {
        let current = savedRef.current;
        if (lifecycle === "draft") {
          const parsed = publicationMetadataSchema.safeParse(form.getValues());
          if (!parsed.success)
            throw new PublicationEditorRequestError("invalid_request");
          current = await persist(parsed.data);
        }
        if (!current)
          throw new PublicationEditorRequestError("draft_unavailable");
        if (intent === "publish") {
          const result = await mutate(() =>
            publishPublicationDraftAction({
              draftId: current.draft.id,
              revision: current.draft.revision,
            }),
          );
          if (result.lifecycle !== "published")
            throw new PublicationEditorRequestError("generic");
          observe({
            ...current,
            source: null,
            cover: null,
            coverUrl: null,
            cleanupPending: true,
            draft: {
              ...current.draft,
              lifecycle: "published",
              publication_model_id: result.model_id,
              revision: result.revision ?? current.draft.revision,
            },
          });
          refreshPublished();
          await cleanup();
          setNotice("published");
        } else setNotice("saved");
        if (!props.initial) {
          flushSync(() => setPending(null));
          router.replace(`/profile/uploads/${current.draft.id}`, {
            scroll: false,
          });
        }
      } else {
        const current = savedRef.current;
        if (!current)
          throw new PublicationEditorRequestError("draft_unavailable");
        const version = {
          draftId: current.draft.id,
          revision: current.draft.revision,
        };
        const result =
          intent === "delete"
            ? await mutate(() =>
                deletePublicationDraftAction({ ...version, confirmed: true }),
              )
            : intent === "cancel"
              ? await mutate(() => cancelPublicationDraftAction(version))
              : await cleanup();
        if (result.lifecycle === null) {
          flushSync(() => {
            setGone(true);
            setPending(null);
          });
          router.replace("/profile/uploads");
          return;
        }
        const data =
          intent === "cleanup" && result.lifecycle === "published"
            ? savedRef.current
            : await read();
        if (!data) throw new PublicationEditorRequestError("draft_unavailable");
        observe(data);
        if (
          intent === "cancel" &&
          !samePublicationMetadata(form.getValues(), publicationMetadata(data))
        )
          setNeedsReview(true);
        setNotice(intent === "cancel" ? "cancelled" : "cleaned");
      }
    } catch (failure) {
      if (!isCurrent()) return;
      const code =
        failure instanceof PublicationEditorRequestError
          ? failure.code
          : "generic";
      setError(code);
      if (code === "upload_not_allowed") setUploadDenied(true);
      if (draftId.current) {
        try {
          const data = await read();
          const changed =
            data.draft.revision !== savedRef.current?.draft.revision;
          observe(data);
          if (data.draft.lifecycle === "published") refreshPublished();
          setNeedsReview(
            code === "conflict" ||
              (data.draft.lifecycle === "draft" && changed),
          );
        } catch (readFailure) {
          setNeedsReview(
            !(
              savedRef.current === null &&
              readFailure instanceof PublicationEditorRequestError &&
              readFailure.code === "draft_unavailable"
            ),
          );
        }
      }
    } finally {
      inFlight.current = false;
      if (isCurrent()) setPending(null);
    }
  }
  function selectFile(kind: "source" | "cover", file: File | null) {
    if (inFlight.current || !editable || (file && !canUpload)) return false;
    if (file && !getPublicationManifest(file, kind)) {
      setError("invalid_request");
      return false;
    }
    setFiles((previous) => ({ ...previous, [kind]: file }));
    setError(null);
    setNotice(null);
    return true;
  }
  return {
    form,
    saved,
    files,
    pending,
    error,
    notice,
    needsReview,
    canUpload,
    dirty,
    lifecycle,
    editable,
    ready,
    readiness,
    gone,
    cleanupPending,
    run,
    selectFile,
    navigationGuard,
  };
}
