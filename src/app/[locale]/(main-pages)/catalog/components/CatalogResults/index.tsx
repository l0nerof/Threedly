"use client";

import ModelsPagination from "@/src/business/components/ModelsPagination";
import { CATALOG_PAGE_SIZE } from "@/src/business/constants/catalogConfig";
import { useCatalogModels } from "@/src/business/hooks/useCatalogModels";
import type {
  CatalogFormatValue,
  CatalogPlanKey,
  CatalogSortValue,
} from "@/src/business/types/catalog";
import { Separator } from "@/src/shared/components/Separator";
import { cn } from "@/src/shared/utils/cn";
import { useLocale, useTranslations } from "next-intl";
import CatalogModelCard from "../CatalogModelCard";
import CatalogResultsMessage from "../CatalogResultsMessage";
import CatalogResultsSkeleton from "../CatalogResultsSkeleton";

type CatalogResultsProps = {
  page: number;
  sort: CatalogSortValue;
  search?: string;
  groups?: string[];
  categories?: string[];
  plans?: CatalogPlanKey[];
  formats?: CatalogFormatValue[];
  onPageChange: (page: number) => void;
};

function CatalogResults({
  page,
  sort,
  search,
  groups,
  categories,
  plans,
  formats,
  onPageChange,
}: CatalogResultsProps) {
  const t = useTranslations("Catalog.resultsArea");
  const locale = useLocale();

  const { data, isLoading, isError, isFetching } = useCatalogModels({
    page,
    sort,
    search,
    groups,
    categories,
    plans,
    formats,
  });

  if (isLoading) {
    return <CatalogResultsSkeleton />;
  }

  if (isError) {
    return (
      <CatalogResultsMessage ariaLabel={t("ariaLabel")} message={t("error")} />
    );
  }

  const models = data?.models ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / CATALOG_PAGE_SIZE);
  const pageFrom = (page - 1) * CATALOG_PAGE_SIZE + 1;
  const pageTo = Math.min(page * CATALOG_PAGE_SIZE, totalCount);
  const pageOfLabel = t("pageOf", {
    from: pageFrom,
    to: pageTo,
    total: totalCount,
  });

  if (models.length === 0) {
    return (
      <CatalogResultsMessage ariaLabel={t("ariaLabel")} message={t("empty")} />
    );
  }

  return (
    <section
      aria-label={t("ariaLabel")}
      className="border-border/60 bg-surface/95 flex flex-col gap-6 rounded-4xl border p-5 shadow-[0_28px_100px_hsl(var(--foreground)/0.08)] backdrop-blur-xl sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-sm leading-6 sm:text-base">
            {t("description")}
          </p>
        </div>

        <div className="border-border/60 text-muted-foreground inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs tracking-[0.12em] uppercase">
          {t("count", { count: totalCount })}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4 md:grid-cols-2 2xl:grid-cols-3",
          isFetching && "opacity-60 transition-opacity duration-200",
        )}
      >
        {models.map((model) => (
          <CatalogModelCard key={model.id} model={model} locale={locale} />
        ))}
      </div>

      <Separator />

      <ModelsPagination
        currentPage={page}
        totalPages={totalPages}
        pageOfLabel={pageOfLabel}
        previousPageLabel={t("previousPage")}
        nextPageLabel={t("nextPage")}
        onPageChange={onPageChange}
      />
    </section>
  );
}

export default CatalogResults;
