"use client";

import { useFavoritesUser } from "@/src/business/hooks/useFavoritesSession";
import { usePublicationEditor } from "@/src/business/hooks/usePublicationEditor";
import { favoritesQueryKeys } from "@/src/business/queries/favorites";
import type { PublicationEditorProps } from "@/src/business/types/modelPublicationEditor";
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
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import PublicationPreview from "../PublicationPreview";
import ReadinessChecklist from "../ReadinessChecklist";
import PublicationActions from "./PublicationActions";
import PublicationContent from "./PublicationContent";

export default function PublicationEditor(props: PublicationEditorProps) {
  const t = useTranslations("Profile.uploads.editor");
  const identity = useFavoritesUser();
  const revision = useQuery({
    queryKey: favoritesQueryKeys.sessionRevision(),
    queryFn: () => 0,
    enabled: false,
    initialData: 0,
  }).data;
  if (identity.data !== props.ownerId || identity.isError)
    return (
      <div className="space-y-3">
        <p role="status">
          {t(identity.isFetching ? "sessionChecking" : "sessionUnavailable")}
        </p>
        <Button variant="outline" onClick={() => void identity.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  return <EditorContents key={`${props.ownerId}:${revision}`} {...props} />;
}

function EditorContents(props: PublicationEditorProps) {
  const editor = usePublicationEditor(props);
  const t = useTranslations("Profile.uploads.editor");
  const [confirmation, setConfirmation] = useState<
    "delete" | "cancel" | "reload" | null
  >(null);
  const activeConfirmation = editor.navigationGuard.active
    ? "leave"
    : confirmation;
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/profile/uploads">
            <ArrowLeft aria-hidden />
            {t("back")}
          </Link>
        </Button>
        <Badge variant="outline">{t(`lifecycle.${editor.lifecycle}`)}</Badge>
        {editor.lifecycle !== "published" && (
          <PublicationPreview editor={editor} ownerId={props.ownerId} />
        )}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t(
          editor.lifecycle === "published"
            ? "publishedTitle"
            : props.initial
              ? "editTitle"
              : "newTitle",
        )}
      </h1>
      {editor.lifecycle !== "published" && (
        <p className="text-muted-foreground text-sm">{t("manualSave")}</p>
      )}
      {!editor.canUpload && editor.lifecycle !== "published" && (
        <p role="alert" className="text-sm">
          {t("noUploadAccess")}
        </p>
      )}
      {editor.lifecycle === "published" ? (
        <div className="bg-surface space-y-5 rounded-2xl border p-6 sm:p-8">
          <CheckCircle2 className="text-primary size-12" aria-hidden />
          <p className="max-w-xl text-base leading-7" role="status">
            {t("publishedDescription")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/profile/uploads">{t("back")}</Link>
            </Button>
            {editor.canUpload && (
              <Button variant="outline" asChild>
                <Link href="/profile/uploads/new">
                  <Plus aria-hidden />
                  {t("createAnother")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form
          noValidate
          className="space-y-8"
          aria-busy={!!editor.pending}
          onSubmit={editor.form.handleSubmit(() => editor.run("save"))}
        >
          <div className="grid items-start gap-6 xl:grid-cols-4">
            <div className="min-w-0 space-y-8 xl:col-span-3">
              <PublicationContent
                editor={editor}
                categoryGroups={props.categoryGroups}
              />
            </div>
            <aside
              aria-label={t("readiness.title")}
              className="space-y-4 xl:sticky xl:top-6"
            >
              <div className="space-y-2">
                <h2 className="font-semibold">{t("readiness.title")}</h2>
                <p className="text-muted-foreground text-sm" role="status">
                  {t("readiness.progress", {
                    complete: editor.readiness.completed,
                    total: editor.readiness.total,
                  })}
                </p>
                <progress
                  className="[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary h-2 w-full appearance-none overflow-hidden rounded-full"
                  aria-label={t("readiness.title")}
                  value={editor.readiness.completed}
                  max={editor.readiness.total}
                />
              </div>
              <ReadinessChecklist
                title={t("readiness.required")}
                items={editor.readiness.items.map((item) => ({
                  ...item,
                  label: t(`readiness.items.${item.key}`),
                }))}
                completeLabel={t("readiness.complete")}
                missingLabel={t("readiness.missing")}
              />
              <p className="text-muted-foreground text-xs leading-5">
                {t("readiness.description")}
              </p>
              {!editor.readiness.metadataValid && (
                <p role="alert" className="text-destructive text-sm">
                  {t("readiness.invalidMetadata")}
                </p>
              )}
            </aside>
          </div>
          <PublicationActions editor={editor} onConfirm={setConfirmation} />
        </form>
      )}
      {editor.lifecycle === "published" && (
        <PublicationActions editor={editor} onConfirm={setConfirmation} />
      )}
      <AlertDialog
        open={activeConfirmation !== null}
        onOpenChange={(open) => {
          if (!open) {
            if (editor.navigationGuard.active) editor.navigationGuard.reject();
            else if (!editor.pending) setConfirmation(null);
          }
        }}
      >
        <AlertDialogContent
          onEscapeKeyDown={(event) => {
            if (editor.pending && !editor.navigationGuard.active)
              event.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeConfirmation && t(`confirm.${activeConfirmation}.title`)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeConfirmation &&
                t(`confirm.${activeConfirmation}.description`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={!!editor.pending && !editor.navigationGuard.active}
            >
              {t("stay")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!!editor.pending}
              onClick={(event) => {
                event.preventDefault();
                const intent = activeConfirmation;
                setConfirmation(null);
                if (intent === "leave") {
                  editor.navigationGuard.accept();
                } else if (intent) void editor.run(intent, intent === "reload");
              }}
            >
              {t("confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
