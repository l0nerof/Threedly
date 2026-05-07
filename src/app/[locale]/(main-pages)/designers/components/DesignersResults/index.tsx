"use client";

import ModelsPagination from "@/src/business/components/ModelsPagination";
import { DESIGNERS_PAGE_SIZE } from "@/src/business/constants/designersConfig";
import {
  DESIGNER_TABS,
  type DesignerTab,
  SORT_LABELS,
} from "@/src/business/constants/designersFiltersConfig";
import { useDesigners } from "@/src/business/hooks/useDesigners";
import type {
  DesignerAccount,
  DesignerLevel,
  DesignerSortValue,
  DesignerSpecialization,
} from "@/src/business/types/designer";
import { Button } from "@/src/shared/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/DropdownMenu/index";
import { Separator } from "@/src/shared/components/Separator";
import { Skeleton } from "@/src/shared/components/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/src/shared/components/Tabs";
import { cn } from "@/src/shared/utils/cn";
import { ArrowUpDown, ChevronDown, LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import DesignerCard from "../DesignerCard";

type DesignerView = "grid" | "list";

type DesignersResultsProps = {
  page: number;
  sort: DesignerSortValue;
  search?: string;
  specializations?: DesignerSpecialization[];
  levels?: DesignerLevel[];
  account?: DesignerAccount[];
  onPageChange: (page: number) => void;
  onSortChange: (sort: DesignerSortValue) => void;
};

function DesignersResultsSkeleton() {
  return (
    <section
      aria-label="Designers"
      className="border-border/60 bg-surface/95 flex flex-col gap-6 rounded-4xl border p-5 shadow-[0_28px_100px_hsl(var(--foreground)/0.08)] backdrop-blur-xl sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-36 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm rounded-full" />
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <article
            key={i}
            className="border-border/60 bg-surface-elevated/95 flex flex-col gap-4 rounded-[1.65rem] border p-5"
          >
            <div className="flex items-start gap-4">
              <Skeleton className="size-14 rounded-2xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DesignersResults({
  page,
  sort,
  search,
  specializations,
  levels,
  account,
  onPageChange,
  onSortChange,
}: DesignersResultsProps) {
  const t = useTranslations("Designers.results");
  const [activeTab, setActiveTab] = useState<DesignerTab>("all");
  const [view, setView] = useState<DesignerView>("grid");

  const { data, isLoading, isError, isFetching } = useDesigners({
    page,
    sort,
    search,
    specializations,
    levels,
    account,
  });

  if (isLoading) {
    return <DesignersResultsSkeleton />;
  }

  if (isError) {
    return (
      <section
        aria-label="Designers"
        className="border-border/60 bg-surface/95 flex flex-col items-center justify-center gap-4 rounded-4xl border p-12 text-center shadow-[0_28px_100px_hsl(var(--foreground)/0.08)] backdrop-blur-xl"
      >
        <p className="text-muted-foreground text-sm">{t("error")}</p>
      </section>
    );
  }

  const designers = data?.designers ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / DESIGNERS_PAGE_SIZE);
  const pageFrom = (page - 1) * DESIGNERS_PAGE_SIZE + 1;
  const pageTo = Math.min(page * DESIGNERS_PAGE_SIZE, totalCount);

  if (designers.length === 0) {
    return (
      <section
        aria-label="Designers"
        className="border-border/60 bg-surface/95 flex flex-col items-center justify-center gap-4 rounded-4xl border p-12 text-center shadow-[0_28px_100px_hsl(var(--foreground)/0.08)] backdrop-blur-xl"
      >
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      </section>
    );
  }

  return (
    <section
      aria-label="Designers"
      className="border-border/60 bg-surface/95 flex flex-col gap-6 rounded-4xl border p-5 shadow-[0_28px_100px_hsl(var(--foreground)/0.08)] backdrop-blur-xl sm:p-6"
    >
      {/* Header */}
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as DesignerTab)}
        >
          <TabsList className="border-border/60 bg-surface/90 h-auto! rounded-full border p-1 backdrop-blur-sm">
            {DESIGNER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:from-primary/20 data-[state=active]:via-primary/14 data-[state=active]:to-primary/8 data-[state=active]:border-primary/25 rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_8px_20px_hsl(var(--primary)/0.14)]"
              >
                {t(`tabs.${tab.value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="group border-border/60 hover:border-primary/35 hover:bg-primary/8 h-9 rounded-full px-3.5 text-sm font-medium"
            >
              <ArrowUpDown
                className="group-hover:text-primary size-3.5 transition-colors"
                aria-hidden
              />
              {t("sortLabel")}:&nbsp;
              <span className="font-semibold">{t(`sort.${sort}`)}</span>
              <ChevronDown
                className="group-hover:text-primary size-3.5 transition-colors"
                aria-hidden
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-40">
            {(Object.keys(SORT_LABELS) as DesignerSortValue[]).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => onSortChange(s)}
                className={cn(sort === s && "font-semibold")}
              >
                {t(`sort.${s}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tabs value={view} onValueChange={(v) => setView(v as DesignerView)}>
          <TabsList className="border-border/60 bg-surface/90 h-auto! rounded-xl border p-1 backdrop-blur-sm">
            <TabsTrigger
              value="grid"
              aria-label="Grid view"
              className="data-[state=active]:from-primary/20 data-[state=active]:via-primary/14 data-[state=active]:to-primary/8 data-[state=active]:border-primary/25 rounded-lg border border-transparent p-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_8px_20px_hsl(var(--primary)/0.14)]"
            >
              <LayoutGrid className="size-4" aria-hidden />
            </TabsTrigger>
            <TabsTrigger
              value="list"
              aria-label="List view"
              className="data-[state=active]:from-primary/20 data-[state=active]:via-primary/14 data-[state=active]:to-primary/8 data-[state=active]:border-primary/25 rounded-lg border border-transparent p-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_8px_20px_hsl(var(--primary)/0.14)]"
            >
              <List className="size-4" aria-hidden />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div
        className={cn(
          view === "grid"
            ? "grid gap-4 md:grid-cols-2 2xl:grid-cols-3"
            : "flex flex-col gap-3",
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
