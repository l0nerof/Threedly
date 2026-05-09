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
  DesignerLevel,
  DesignerSortValue,
} from "@/src/business/types/designer";
import { Button } from "@/src/shared/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/DropdownMenu/index";
import { Separator } from "@/src/shared/components/Separator";
import { Tabs, TabsList, TabsTrigger } from "@/src/shared/components/Tabs";
import { cn } from "@/src/shared/utils/cn";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import DesignerCard from "../DesignerCard";
import DesignersResultsEmpty from "../DesignersResultsEmpty";
import DesignersResultsSkeleton from "../DesignersResultsSkeleton";

type DesignersResultsProps = {
  page: number;
  sort: DesignerSortValue;
  search?: string;
  specializations?: string[];
  levels?: DesignerLevel[];
  onPageChange: (page: number) => void;
  onSortChange: (sort: DesignerSortValue) => void;
};

function DesignersResults({
  page,
  sort,
  search,
  specializations,
  levels,
  onPageChange,
  onSortChange,
}: DesignersResultsProps) {
  const t = useTranslations("Designers.results");
  const [activeTab, setActiveTab] = useState<DesignerTab>("all");

  const { data, isLoading, isError, isFetching } = useDesigners({
    page,
    sort,
    search,
    specializations,
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden sm:block">
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
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="group border-border/60 hover:border-primary/35 hover:bg-primary/8 h-9 w-full rounded-full px-3.5 text-sm font-medium sm:hidden"
            >
              <span className="font-semibold">{t(`tabs.${activeTab}`)}</span>
              <ChevronDown
                className="group-hover:text-primary size-3.5 transition-colors"
                aria-hidden
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-48">
            {DESIGNER_TABS.map((tab) => (
              <DropdownMenuItem
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(activeTab === tab.value && "font-semibold")}
              >
                {t(`tabs.${tab.value}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="group border-border/60 hover:border-primary/35 hover:bg-primary/8 h-9 w-full rounded-full px-3.5 text-sm font-medium sm:w-auto"
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
