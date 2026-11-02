"use client";

import type { usePublicationEditor } from "@/src/business/hooks/usePublicationEditor";
import { Button } from "@/src/shared/components/Button";
import { LoaderCircle, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PublicationActions({
  editor,
  onConfirm,
}: {
  editor: ReturnType<typeof usePublicationEditor>;
  onConfirm: (intent: "delete" | "cancel" | "reload") => void;
}) {
  const t = useTranslations("Profile.uploads.editor");
  const published = editor.lifecycle === "published";
  if (published && !editor.cleanupPending && !editor.needsReview) return null;
  return (
    <div className="bg-surface/95 sticky bottom-0 z-20 space-y-3 rounded-2xl border p-4 shadow-lg backdrop-blur sm:p-5">
      {published && (
        <p className="text-sm leading-6">{t("publishedCleanupPending")}</p>
      )}
      {editor.error && (
        <p role="alert" className="text-destructive text-sm">
          {t(`errors.${editor.error}`)}
        </p>
      )}
      {editor.notice && !published && (
        <p role="status" className="text-sm">
          {t(`notices.${editor.notice}`)}
        </p>
      )}
      {editor.needsReview && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm">{t("reviewRequired")}</p>
          <Button
            type="button"
            variant="outline"
            disabled={!!editor.pending}
            onClick={() => onConfirm("reload")}
          >
            {t("loadSaved")}
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-muted-foreground text-sm"
          role={editor.pending ? "status" : undefined}
        >
          {editor.pending ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
              {t(`pending.${editor.pending}`)}
            </span>
          ) : published ? null : (
            t(editor.dirty ? "unsaved" : "savedState")
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {editor.saved &&
            editor.lifecycle !== "published" &&
            editor.lifecycle !== "deleting" && (
              <Button
                type="button"
                variant="ghost"
                disabled={!!editor.pending || editor.needsReview}
                onClick={() => onConfirm("delete")}
              >
                {t("delete")}
              </Button>
            )}
          {editor.lifecycle === "draft" && (
            <>
              <Button
                type="submit"
                variant="outline"
                disabled={
                  !editor.editable ||
                  !editor.dirty ||
                  (!editor.saved && !editor.canUpload)
                }
              >
                {t("save")}
              </Button>
              <Button
                type="button"
                disabled={
                  !editor.editable || !editor.canUpload || !editor.ready
                }
                onClick={() =>
                  void editor.form.handleSubmit(() => editor.run("publish"))()
                }
              >
                <Upload aria-hidden />
                {t("publish")}
              </Button>
            </>
          )}
          {editor.lifecycle === "publishing" && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={!!editor.pending || editor.needsReview}
                onClick={() => onConfirm("cancel")}
              >
                {t("cancelPublish")}
              </Button>
              <Button
                type="button"
                disabled={
                  !!editor.pending || !editor.canUpload || editor.needsReview
                }
                onClick={() => void editor.run("publish")}
              >
                {t("retryPublish")}
              </Button>
            </>
          )}
          {(editor.cleanupPending ||
            editor.lifecycle === "cancelling" ||
            editor.lifecycle === "deleting" ||
            editor.error === "cleanup_incomplete") && (
            <Button
              type="button"
              variant="outline"
              disabled={!!editor.pending || editor.needsReview}
              onClick={() => void editor.run("cleanup")}
            >
              {t("retryCleanup")}
            </Button>
          )}
        </div>
      </div>
      {editor.lifecycle === "draft" && !editor.ready && (
        <p className="text-muted-foreground text-xs">
          {t("publishRequirements")}
        </p>
      )}
    </div>
  );
}
