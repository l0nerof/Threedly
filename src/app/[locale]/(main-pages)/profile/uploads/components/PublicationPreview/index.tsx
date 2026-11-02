"use client";

import ModelTabs from "@/src/app/[locale]/(main-pages)/catalog/[slug]/components/ModelTabs";
import { fetchPublicationDraftAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/draft-actions";
import { fetchPublicationPreviewAuthorAction } from "@/src/app/[locale]/(main-pages)/profile/uploads/preview-actions";
import ModelDetailHero from "@/src/business/components/ModelDetailHero";
import ModelDetailOverview from "@/src/business/components/ModelDetailOverview";
import ModelFileList from "@/src/business/components/ModelFileList";
import type { usePublicationEditor } from "@/src/business/hooks/usePublicationEditor";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import type { PublicationPreviewSnapshot } from "@/src/business/types/modelPublicationPreview";
import { PublicationEditorRequestError } from "@/src/business/utils/modelPublicationEditor";
import {
  awaitPublicationPreview,
  publicationPreviewAuthor,
  publicationPreviewCover,
  publicationPreviewSnapshot,
} from "@/src/business/utils/modelPublicationPreview";
import { Button } from "@/src/shared/components/Button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/shared/components/Sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, ImageOff, ScanEye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

type Snapshot = PublicationPreviewSnapshot & { localCoverUrl: string | null };
type Props = {
  editor: ReturnType<typeof usePublicationEditor>;
  ownerId: string;
};

export default function PublicationPreview({ editor, ownerId }: Props) {
  const t = useTranslations("Profile.uploads.editor.preview");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const coverUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (coverUrl.current) URL.revokeObjectURL(coverUrl.current);
    },
    [],
  );
  function changeOpen(open: boolean) {
    if (coverUrl.current) URL.revokeObjectURL(coverUrl.current);
    coverUrl.current = null;
    if (!open) return setSnapshot(null);
    const current = publicationPreviewSnapshot(
      editor.form.getValues(),
      editor.files,
      editor.saved,
    );
    if (current.coverFile)
      coverUrl.current = URL.createObjectURL(current.coverFile);
    setSnapshot({ ...current, localCoverUrl: coverUrl.current });
  }
  return (
    <Sheet open={snapshot !== null} onOpenChange={changeOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={!!editor.pending || editor.gone}
        >
          <Eye aria-hidden />
          {t("open")}
        </Button>
      </SheetTrigger>
      <SheetContent
        showCloseButton={false}
        className="bg-background w-full gap-0 overflow-y-auto border-0 motion-reduce:animate-none motion-reduce:transition-none sm:max-w-none"
      >
        <SheetHeader className="bg-background sticky top-0 z-10 gap-3 border-b p-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                <ArrowLeft aria-hidden />
                {t("close")}
              </Button>
            </SheetClose>
            <SheetTitle>{t("title")}</SheetTitle>
          </div>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        {snapshot && <PreviewContent snapshot={snapshot} ownerId={ownerId} />}
      </SheetContent>
    </Sheet>
  );
}

function PreviewContent({
  snapshot,
  ownerId,
}: {
  snapshot: Snapshot;
  ownerId: string;
}) {
  const t = useTranslations("Profile.uploads.editor.preview");
  const hero = useTranslations("ModelPage.hero");
  const tabs = useTranslations("ModelPage.tabs");
  const locale = useLocale();
  const [language, setLanguage] = useState<"ua" | "en">(
    locale === "ua" ? "ua" : "en",
  );
  const [imageFailed, setImageFailed] = useState(false);
  const client = useQueryClient();
  const sessionRevision = client.getQueryData<number>(
    favoritesQueryKeys.sessionRevision(),
  );
  const instance = useId();
  function checkSession() {
    if (
      client.getQueryData(favoritesQueryKeys.currentUser()) !== ownerId ||
      client.getQueryData(favoritesQueryKeys.sessionRevision()) !==
        sessionRevision
    )
      throw new PublicationEditorRequestError("session_changed");
  }
  const author = useQuery({
    queryKey: [
      "publication-preview-author",
      ownerId,
      sessionRevision,
      instance,
    ],
    queryFn: async ({ signal }) => {
      checkSession();
      const value = await awaitPublicationPreview(
        fetchPublicationPreviewAuthorAction({ ownerId }),
        signal,
      );
      checkSession();
      return publicationPreviewAuthor(value, ownerId);
    },
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const cover = useQuery({
    queryKey: ["publication-preview-cover", ownerId, sessionRevision, instance],
    enabled: snapshot.savedCover !== null,
    queryFn: async ({ signal }) => {
      checkSession();
      if (!snapshot.savedCover)
        throw new PublicationEditorRequestError("file_unavailable");
      const value = await awaitPublicationPreview(
        fetchPublicationDraftAction({ draftId: snapshot.savedCover.draftId }),
        signal,
      );
      checkSession();
      return publicationPreviewCover(value, ownerId, snapshot.savedCover);
    },
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const metadata = snapshot.metadata;
  const title =
    (language === "ua" ? metadata.titleUa : metadata.titleEn).trim() ||
    t("emptyTitle");
  const description =
    language === "ua" ? metadata.descriptionUa : metadata.descriptionEn;
  const imageUrl = snapshot.localCoverUrl ?? cover.data;
  const unavailable = cover.isError || imageFailed;
  return (
    <div className="container flex flex-col gap-8 py-8 sm:gap-16">
      <div
        role="group"
        aria-label={t("language")}
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-muted-foreground mr-2 text-sm">
          {t("language")}
        </span>
        <Button
          type="button"
          variant="outline"
          aria-pressed={language === "ua"}
          onClick={() => setLanguage("ua")}
        >
          Українська
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-pressed={language === "en"}
          onClick={() => setLanguage("en")}
        >
          English
        </Button>
      </div>
      <ModelDetailHero
        title={title}
        plan={metadata.minimumPlan}
        format={snapshot.source?.format ?? null}
        specificationsTitle={hero("specificationsTitle")}
        planInfo={hero("planInfo", { plan: metadata.minimumPlan })}
        media={
          imageUrl && !unavailable ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <ImageOff className="text-muted-foreground size-10" aria-hidden />
              <p
                role={unavailable ? "alert" : "status"}
                className="text-muted-foreground text-sm"
              >
                {t(
                  unavailable
                    ? "coverError"
                    : snapshot.savedCover
                      ? "coverLoading"
                      : "emptyCover",
                )}
              </p>
              {unavailable && snapshot.savedCover && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={cover.isFetching}
                  onClick={async () => {
                    const result = await cover.refetch();
                    if (!result.isError) setImageFailed(false);
                  }}
                >
                  {t("retryCover")}
                </Button>
              )}
            </div>
          )
        }
        meta={
          <p className="text-muted-foreground text-sm">{t("unpublished")}</p>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled
            >
              <ScanEye className="size-4" aria-hidden />
              {hero("previewButton")}
            </Button>
            <Button type="button" disabled>
              {t("downloadUnavailable")}
            </Button>
          </>
        }
      />
      <ModelTabs
        overviewContent={
          <ModelDetailOverview
            description={description?.trim() || null}
            creator={author.isError ? null : author.data}
            aboutTitle={tabs("aboutTitle")}
            aboutEmpty={t("emptyDescription")}
            designerTitle={tabs("designerTitle")}
            creatorAction={
              <span className="text-muted-foreground text-xs">
                {t("profileUnavailable")}
              </span>
            }
            creatorFallback={
              <div className="space-y-2">
                <p
                  role={author.isError ? "alert" : "status"}
                  className="text-muted-foreground text-sm"
                >
                  {t(author.isError ? "authorError" : "authorLoading")}
                </p>
                {author.isError && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={author.isFetching}
                    onClick={() => void author.refetch()}
                  >
                    {t("retryAuthor")}
                  </Button>
                )}
              </div>
            }
          />
        }
        filesContent={
          <div className="flex flex-col gap-4 p-6">
            <p className="text-muted-foreground text-sm">
              {tabs("filesAndFormatsDescription")}
            </p>
            {snapshot.source ? (
              <ModelFileList
                files={[snapshot.source]}
                locale={language}
                primaryLabel={tabs("filesPrimary")}
                getKey={(file) => file.file_name}
                renderAction={() => (
                  <Button type="button" disabled className="shrink-0">
                    {t("downloadUnavailable")}
                  </Button>
                )}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("emptySource")}
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}
