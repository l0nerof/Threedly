"use client";

import { useModelManagement } from "@/src/business/hooks/useModelManagement";
import type { ModelManagementControlsProps } from "@/src/business/types/modelManagement";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/shared/components/AlertDialog";
import { Button } from "@/src/shared/components/Button";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import ModelEditSheet from "../ModelEditSheet";

export default function ModelManagementActions(
  props: ModelManagementControlsProps,
) {
  const control = useModelManagement(props.ownerId, props.model.id);
  return (
    <SessionControls key={control.scopeKey} {...props} control={control} />
  );
}

function SessionControls({
  model,
  canUpload,
  categoryGroups,
  control,
}: ModelManagementControlsProps & {
  control: ReturnType<typeof useModelManagement>;
}) {
  const t = useTranslations("Profile.uploads.management");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const effective = control.observed ?? model;
  const disabled = control.isPending || !control.canAct;
  const publicationDenied =
    !canUpload || control.lastError === "upload_not_allowed";
  if (control.gone)
    return (
      <p role="status" className="text-muted-foreground text-sm">
        {t("deleted")}
      </p>
    );
  if (!control.identityMatches)
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p role="status" className="text-muted-foreground text-sm">
          {t(
            control.checkingSession ? "sessionChecking" : "sessionUnavailable",
          )}
        </p>
        {!control.checkingSession && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void control.retrySession()}
          >
            {t("retry")}
          </Button>
        )}
      </div>
    );
  return (
    <div className="flex flex-col gap-3" aria-busy={control.isPending}>
      {effective.deletion_pending && (
        <p role="status" className="text-muted-foreground text-sm">
          {t("deletionPending")}
        </p>
      )}
      {control.lastError && (
        <p role="alert" className="text-destructive text-sm">
          {t(`errors.${control.lastError}`)}
        </p>
      )}
      {control.needsRecheck && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-muted-foreground text-sm">
            {t("recheckRequired")}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={control.isPending}
            onClick={() => void control.recheck()}
          >
            {t("recheck")}
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!effective.deletion_pending && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={
                disabled ||
                !categoryGroups?.some((group) => group.categories.length)
              }
              onClick={() => setEditing(true)}
            >
              {t("edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                disabled ||
                (effective.status !== "published" && publicationDenied)
              }
              onClick={() =>
                void control.run({
                  type:
                    effective.status === "published" ? "archive" : "publish",
                })
              }
            >
              {t(effective.status === "published" ? "archive" : "publish")}
            </Button>
          </>
        )}
        <AlertDialog
          open={deleting}
          onOpenChange={(open) => {
            if (!control.isPending) setDeleting(open);
          }}
        >
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              className="text-destructive"
            >
              {t(effective.deletion_pending ? "continueDelete" : "delete")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteDescription", {
                  title: locale === "ua" ? model.title_ua : model.title_en,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {control.lastError && (
              <p role="alert" className="text-destructive text-sm">
                {t(`errors.${control.lastError}`)}
              </p>
            )}
            {effective.deletion_pending && (
              <p className="text-muted-foreground text-sm">
                {t("deletionPending")}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={control.isPending}>
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={disabled}
                onClick={async (event) => {
                  event.preventDefault();
                  const result = await control.run({ type: "delete" });
                  if (result?.ok) setDeleting(false);
                }}
              >
                {t(
                  control.isPending
                    ? "deleting"
                    : effective.deletion_pending
                      ? "continueDelete"
                      : "confirmDelete",
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {!effective.deletion_pending && publicationDenied && (
        <p className="text-muted-foreground text-xs">
          {t("publishUnavailable")}
        </p>
      )}
      {!categoryGroups && !effective.deletion_pending && (
        <p className="text-muted-foreground text-xs">
          {t("categoriesUnavailable")}
        </p>
      )}
      {control.isPending && (
        <p role="status" className="text-muted-foreground text-sm">
          {t(control.pendingIntent === "delete" ? "deleting" : "pending")}
        </p>
      )}
      <ModelEditSheet
        open={editing}
        onOpenChange={(open) => {
          if (!control.isPending) setEditing(open);
        }}
        read={control.read}
        onSave={(metadata) => control.run({ type: "update", metadata })}
        categoryGroups={categoryGroups}
        isPending={control.isPending}
        canSubmit={control.canAct && !effective.deletion_pending}
        error={control.lastError}
      />
    </div>
  );
}
