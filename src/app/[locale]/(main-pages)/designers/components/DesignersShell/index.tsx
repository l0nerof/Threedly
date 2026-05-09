"use client";

import type { CategoryGroupOption } from "@/src/app/[locale]/(main-pages)/designers/actions";
import { useDesignersCount } from "@/src/business/hooks/useDesignersCount";
import { useDesignersFilters } from "@/src/business/hooks/useDesignersFilters";
import { Button } from "@/src/shared/components/Button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/Sheet";
import { useTranslations } from "next-intl";
import { useState } from "react";
import DesignersFilters from "../DesignersFilters";
import DesignersResults from "../DesignersResults";
import DesignersSearchBar from "../DesignersSearchBar";

type DesignersShellProps = {
  categoryGroups: CategoryGroupOption[];
};

function DesignersShell({ categoryGroups }: DesignersShellProps) {
  const t = useTranslations("Designers.shell");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const {
    page,
    selectedSort,
    selectedSpecializations,
    selectedLevels,
    draftSpecializations,
    draftLevels,
    searchValue,
    activeSearch,
    hasActiveFilters,
    hasDraft,
    activeChips,
    setSearchValue,
    handleSpecializationToggle,
    handleLevelToggle,
    applyAllDrafts,
    handleReset,
    setPage,
    applyFilter,
  } = useDesignersFilters();

  const { data: filteredCount, isFetching: isCountFetching } =
    useDesignersCount({
      search: activeSearch,
      specializations:
        draftSpecializations.length > 0 ? draftSpecializations : undefined,
      levels: draftLevels.length > 0 ? draftLevels : undefined,
      enabled: hasDraft || isMobileFiltersOpen,
    });

  const countLabel = isCountFetching
    ? t("mobileSheet.applyLoading")
    : t("mobileSheet.applyButton", { count: filteredCount ?? 0 });

  const handleMobileApply = () => {
    applyAllDrafts();
    setIsMobileFiltersOpen(false);
  };

  return (
    <section className="bg-background text-foreground relative w-full overflow-hidden">
      <div className="relative container flex flex-col gap-10 pt-28 pb-24 sm:gap-12 sm:pt-32 sm:pb-32">
        <DesignersSearchBar
          searchValue={searchValue}
          activeChips={activeChips}
          onSearchChange={setSearchValue}
          onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[minmax(290px,320px)_minmax(0,1fr)]">
          <aside className="hidden self-start lg:sticky lg:top-28 lg:block">
            <DesignersFilters
              categoryGroups={categoryGroups}
              selectedSpecializations={draftSpecializations}
              selectedLevels={draftLevels}
              showReset={hasActiveFilters}
              onSpecializationToggle={handleSpecializationToggle}
              onLevelToggle={handleLevelToggle}
              onApply={applyAllDrafts}
              onReset={handleReset}
              idPrefix="designers-sidebar"
              filteredCount={hasDraft ? filteredCount : undefined}
              isCountFetching={hasDraft ? isCountFetching : undefined}
              hasDraft={hasDraft}
            />
          </aside>

          <div className="min-w-0 self-start">
            <DesignersResults
              page={page}
              sort={selectedSort}
              search={activeSearch}
              specializations={
                selectedSpecializations.length > 0
                  ? selectedSpecializations
                  : undefined
              }
              levels={selectedLevels.length > 0 ? selectedLevels : undefined}
              onPageChange={setPage}
              onSortChange={(s) => applyFilter({ sort: s })}
            />
          </div>
        </div>
      </div>

      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent
          side="left"
          className="flex w-full max-w-md flex-col overflow-hidden p-0"
        >
          <SheetHeader className="border-border/60 shrink-0 border-b p-4">
            <SheetTitle>{t("mobileSheet.title")}</SheetTitle>
            <SheetDescription>{t("mobileSheet.description")}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <DesignersFilters
              categoryGroups={categoryGroups}
              selectedSpecializations={draftSpecializations}
              selectedLevels={draftLevels}
              showReset={hasActiveFilters}
              onSpecializationToggle={handleSpecializationToggle}
              onLevelToggle={handleLevelToggle}
              onReset={handleReset}
              idPrefix="designers-mobile-sheet"
            />
          </div>

          <div className="border-border/60 shrink-0 border-t p-4">
            <Button
              className="w-full"
              onClick={handleMobileApply}
              disabled={isCountFetching}
              aria-live="polite"
              aria-atomic="true"
            >
              {countLabel}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default DesignersShell;
