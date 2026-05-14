"use client";

import ModelsPagination from "@/src/business/components/ModelsPagination";
import { DESIGNERS_PAGE_SIZE } from "@/src/business/constants/designersConfig";
import { useDesigners } from "@/src/business/hooks/useDesigners";
import type {
  DesignerLevel,
  DesignerSortValue,
} from "@/src/business/types/designer";
import { Separator } from "@/src/shared/components/Separator";
import { cn } from "@/src/shared/utils/cn";
import { useTranslations } from "next-intl";
import DesignerCard from "../DesignerCard";
import DesignersResultsEmpty from "../DesignersResultsEmpty";
import DesignersResultsSkeleton from "../DesignersResultsSkeleton";

type DesignersResultsProps = {
  page: number;
  sort: DesignerSortValue;
  groups?: string[];
  search?: string;
  levels?: DesignerLevel[];
  onPageChange: (page: number) => void;
};

function DesignersResults({
  page,
  sort,
  groups,
  search,
  levels,
  onPageChange,
}: DesignersResultsProps) {
  const t = useTranslations("Designers.results");

  const { data, isLoading, isError, isFetching } = useDesigners({
    page,
    sort,
    groups,
    search,
    levels,
  });

  if (isLoading) {
    return <DesignersResultsSkeleton />;
  }

  if (isError) {
    return <DesignersResultsEmpty message={t("error")} />;
  }

  const designers = data?.designers ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / DESIGNERS_PAGE_SIZE);
  const pageFrom = (page - 1) * DESIGNERS_PAGE_SIZE + 1;
  const pageTo = Math.min(page * DESIGNERS_PAGE_SIZE, totalCount);

  if (designers.length === 0) {
    return <DesignersResultsEmpty message={t("empty")} />;
  }

  return (
    <section
      aria-label="Designers"
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
          {t("creators", { count: totalCount })}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4 md:grid-cols-2 2xl:grid-cols-3",
          isFetching && "opacity-60 transition-opacity duration-200",
        )}
      >
        {designers.map((designer) => (
          <DesignerCard key={designer.id} designer={designer} />
        ))}
      </div>

      <Separator />

      <ModelsPagination
        currentPage={page}
        totalPages={totalPages}
        pageOfLabel={t("pageOf", {
          from: pageFrom,
          to: pageTo,
          total: totalCount,
        })}
        previousPageLabel={t("previousPage")}
        nextPageLabel={t("nextPage")}
        onPageChange={onPageChange}
      />
    </section>
  );
}

export default DesignersResults;
