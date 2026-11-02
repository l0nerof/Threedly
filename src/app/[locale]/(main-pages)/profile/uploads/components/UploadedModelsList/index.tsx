"use client";

import ModelsPagination from "@/src/business/components/ModelsPagination";
import { UPLOADS_PAGE_SIZE } from "@/src/business/constants/profileConfig";
import { useFavoritesUser } from "@/src/business/hooks/useFavoritesSession";
import type { CategoryGroupOption } from "@/src/business/types/category";
import type { OwnedModelsPage } from "@/src/business/types/modelManagement";
import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import ModelManagementActions from "../ModelManagementActions";

export default function UploadedModelsList({
  page,
  categoryGroups,
}: {
  page: Omit<OwnedModelsPage, "categoryGroups">;
  categoryGroups: CategoryGroupOption[] | null;
}) {
  const t = useTranslations("Profile.uploads");
  const locale = useLocale();
  const identity = useFavoritesUser();
  const listId = useId();
  const numbers = new Intl.NumberFormat(locale === "ua" ? "uk-UA" : "en-US", {
    maximumFractionDigits: 1,
  });
  return (
    <Card className="border-border/60 bg-surface/80 gap-4 rounded-3xl p-6 shadow-sm">
      <CardHeader className="p-0">
        <CardTitle>
          <h2>{t("list.title")}</h2>
        </CardTitle>
        <CardDescription>{t("list.description")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {identity.data !== page.profileId || identity.isError ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="status" className="text-muted-foreground text-sm">
              {t(
                identity.isPending || identity.isFetching
                  ? "management.sessionChecking"
                  : "management.sessionUnavailable",
              )}
            </p>
            {!identity.isFetching && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void identity.refetch()}
              >
                {t("management.retry")}
              </Button>
            )}
          </div>
        ) : page.models.length ? (
          <>
            <div className="divide-border/60 divide-y">
              {page.models.map((model) => (
                <article
                  key={model.id}
                  aria-labelledby={`${listId}-${model.id}`}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        id={`${listId}-${model.id}`}
                        className="text-sm font-medium break-words"
                      >
                        {locale === "ua" ? model.title_ua : model.title_en}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {model.file_format?.toUpperCase() ??
                          t("list.unknownFormat")}
                        {" · "}
                        {model.file_size_bytes === null
                          ? t("list.unknownSize")
                          : `${numbers.format(model.file_size_bytes / 1024 / 1024)} MB`}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-full">
                      {t(`status.${model.status}`)}
                    </Badge>
                  </div>
                  <ModelManagementActions
                    key={`${model.updated_at}:${model.status}:${model.deletion_pending}:${page.canUpload}`}
                    model={model}
                    ownerId={page.profileId}
                    canUpload={page.canUpload}
                    categoryGroups={categoryGroups}
                  />
                </article>
              ))}
            </div>
            <ModelsPagination
              currentPage={page.currentPage}
              totalPages={page.totalPages}
              pageOfLabel={t("list.pageOf", {
                from: (page.currentPage - 1) * UPLOADS_PAGE_SIZE + 1,
                to: Math.min(
                  page.currentPage * UPLOADS_PAGE_SIZE,
                  page.totalCount,
                ),
                total: page.totalCount,
              })}
              previousPageLabel={t("list.previousPage")}
              nextPageLabel={t("list.nextPage")}
            />
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t("empty.title")}</p>
            <p className="text-muted-foreground text-sm">
              {t("empty.description")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
