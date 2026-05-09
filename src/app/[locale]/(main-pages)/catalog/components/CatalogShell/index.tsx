"use client";

import {
  catalogFormatValues,
  catalogPlanKeys,
  catalogSortValues,
} from "@/src/business/constants/catalogConfig";
import { useCatalogModelsCount } from "@/src/business/hooks/useCatalogModelsCount";
import type {
  CatalogFilterOption,
  CatalogFormatValue,
  CatalogPlanKey,
} from "@/src/business/types/catalog";
import type { CategoryGroupOption } from "@/src/business/types/category";
import {
  flattenCategoryGroups,
  haveSameValues,
  resolveCategoryGroupLabel,
  resolveOptionLabel,
} from "@/src/business/utils/catalogFilters";
import { Button } from "@/src/shared/components/Button";
import { Input } from "@/src/shared/components/Input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/Sheet";
import {
  parseListParam,
  splitParam,
  useUrlFilters,
} from "@/src/shared/hooks/use-url-filters";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CatalogFilters from "../CatalogFilters";
import CatalogResults from "../CatalogResults";
import CatalogSortDropdown from "../CatalogSortDropdown";

type CatalogShellProps = {
  categoryGroups: CategoryGroupOption[];
};

function CatalogShell({ categoryGroups }: CatalogShellProps) {
  const t = useTranslations("Catalog");
  const searchParams = useSearchParams();
  const categories: CatalogFilterOption[] =
    flattenCategoryGroups(categoryGroups);

  // ── Committed state from URL ───────────────────────────────────────────────
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const selectedSort =
    parseListParam(searchParams.get("sort"), catalogSortValues)[0] ??
    catalogSortValues[0];

  const categoriesParam = searchParams.get("category") ?? "";
  const groupParam = searchParams.get("group") ?? "";
  const plansParam = searchParams.get("plans") ?? "";
  const formatsParam = searchParams.get("formats") ?? "";

  const selectedCategories = splitParam(categoriesParam);
  const selectedGroups =
    selectedCategories.length > 0 ? [] : splitParam(groupParam);
  const selectedPlans = parseListParam(plansParam, catalogPlanKeys);
  const selectedFormats = parseListParam(formatsParam, catalogFormatValues);

  // ── Draft state (what user is selecting before applying) ───────────────────
  const [draftGroups, setDraftGroups] = useState(selectedGroups);
  const [draftCategories, setDraftCategories] = useState(selectedCategories);
  const [draftPlans, setDraftPlans] = useState<CatalogPlanKey[]>(selectedPlans);
  const [draftFormats, setDraftFormats] =
    useState<CatalogFormatValue[]>(selectedFormats);

  // Sync drafts when URL changes externally (back/forward, reset)
  useEffect(() => {
    if (categoriesParam) {
      setDraftGroups([]);
      return;
    }

    setDraftGroups(splitParam(groupParam));
  }, [categoriesParam, groupParam]);

  useEffect(() => {
    setDraftCategories(splitParam(categoriesParam));
  }, [categoriesParam]);

  useEffect(() => {
    setDraftPlans(parseListParam(plansParam, catalogPlanKeys));
  }, [plansParam]);

  useEffect(() => {
    setDraftFormats(parseListParam(formatsParam, catalogFormatValues));
  }, [formatsParam]);

  // ── Shared URL filter logic ────────────────────────────────────────────────
  const {
    searchValue,
    setSearchValue,
    activeSearch,
    applyFilter,
    setPage,
    resetAll,
  } = useUrlFilters();

  // ── Mobile panel ───────────────────────────────────────────────────────────
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // ── Draft toggle handlers (checkbox clicks — update draft only) ────────────
  const handleGroupToggle = (value: string) => {
    setDraftGroups((prev) =>
      prev.includes(value)
        ? prev.filter((group) => group !== value)
        : [...prev, value],
    );
    setDraftCategories([]);
  };

  const handleCategoryToggle = (value: string) => {
    setDraftGroups([]);
    setDraftCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    );
  };

  const handlePlanToggle = (value: CatalogPlanKey) => {
    setDraftPlans((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  };

  const handleFormatToggle = (value: CatalogFormatValue) => {
    setDraftFormats((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  };

  // ── Apply all drafts to URL ────────────────────────────────────────────────
  const applyAllDrafts = () => {
    applyFilter({
      category: draftCategories.length > 0 ? draftCategories.join(",") : null,
      group:
        draftCategories.length === 0 && draftGroups.length > 0
          ? draftGroups.join(",")
          : null,
      plans: draftPlans.length > 0 ? draftPlans.join(",") : null,
      formats: draftFormats.length > 0 ? draftFormats.join(",") : null,
    });
  };

  const handleMobileApply = () => {
    applyAllDrafts();
    setIsMobileFiltersOpen(false);
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setDraftGroups([]);
    setDraftCategories([]);
    setDraftPlans([]);
    setDraftFormats([]);
    resetAll();
  };

  // ── Active/draft filter detection ──────────────────────────────────────────
  const urlSearch = searchParams.get("q") ?? "";

  // Committed filters (for chips and reset visibility)
  const hasCommittedFilters =
    urlSearch.length > 0 ||
    selectedGroups.length > 0 ||
    selectedCategories.length > 0 ||
    selectedPlans.length > 0 ||
    selectedFormats.length > 0;

  // Draft includes uncommitted selections → shows reset button
  const hasActiveFilters =
    hasCommittedFilters ||
    draftGroups.length > 0 ||
    draftCategories.length > 0 ||
    draftPlans.length > 0 ||
    draftFormats.length > 0;

  // Chips are based on committed URL state only
  const activeChips = [
    urlSearch
      ? {
          key: `search-${urlSearch}`,
          label: urlSearch,
          onRemove: () => {
            setSearchValue("");
            applyFilter({ q: null });
          },
        }
      : null,
    ...selectedGroups.map((group) => ({
      key: `group-${group}`,
      label: resolveCategoryGroupLabel(categoryGroups, group),
      onRemove: () => {
        const next = selectedGroups.filter(
          (selectedGroup) => selectedGroup !== group,
        );
        setDraftGroups(next);
        applyFilter({ group: next.join(",") || null, category: null });
      },
    })),
    ...selectedCategories.map((category) => ({
      key: `category-${category}`,
      label: resolveOptionLabel(categories, category),
      onRemove: () => {
        const next = selectedCategories.filter((c) => c !== category);
        setDraftCategories(next);
        applyFilter({ category: next.join(",") || null, group: null });
      },
    })),
    ...selectedPlans.map((plan) => ({
      key: `plan-${plan}`,
      label: t(`filters.plan.options.${plan}.label`),
      onRemove: () => {
        const next = selectedPlans.filter((p) => p !== plan);
        setDraftPlans(next);
        applyFilter({ plans: next.join(",") || null });
      },
    })),
    ...selectedFormats.map((format) => ({
      key: `format-${format}`,
      label: t(`filters.format.options.${format}.label`),
      onRemove: () => {
        const next = selectedFormats.filter((f) => f !== format);
        setDraftFormats(next);
        applyFilter({ formats: next.join(",") || null });
      },
    })),
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  // ── Draft diff — true when any draft differs from committed URL state ────────
  const hasDraft =
    !haveSameValues(draftGroups, selectedGroups) ||
    !haveSameValues(draftCategories, selectedCategories) ||
    !haveSameValues(draftPlans, selectedPlans) ||
    !haveSameValues(draftFormats, selectedFormats);

  // ── Filtered models count (runs on draft state for live feedback) ──────────
  const { data: filteredCount, isFetching: isCountFetching } =
    useCatalogModelsCount({
      search: activeSearch,
      groups:
        draftCategories.length === 0 && draftGroups.length > 0
          ? draftGroups
          : undefined,
      categories: draftCategories.length > 0 ? draftCategories : undefined,
      plans: draftPlans.length > 0 ? draftPlans : undefined,
      formats: draftFormats.length > 0 ? draftFormats : undefined,
      enabled: hasDraft || isMobileFiltersOpen,
    });

  const countLabel = isCountFetching
    ? t("filtersPanel.countLoading")
    : t("filtersPanel.showCount", { count: filteredCount ?? 0 });

  return (
    <section className="bg-background text-foreground relative w-full overflow-hidden">
      <div className="relative container flex flex-col gap-10 pt-28 pb-24 sm:gap-12 sm:pt-32 sm:pb-32">
        <header className="flex flex-col">
          <h1 className="sr-only">{t("title")}</h1>

          <div className="border-border/60 bg-surface/95 flex flex-col gap-4 rounded-4xl border p-4 shadow-[0_26px_90px_hsl(var(--foreground)/0.07)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <span className="sr-only">{t("searchLabel")}</span>
                <Search
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
                />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchLabel")}
                  className="border-border/60 bg-surface-elevated/90 h-12 rounded-full pr-4 pl-11 text-sm shadow-none"
                />
              </label>

              <CatalogSortDropdown
                selectedSort={selectedSort}
                onSortChange={(sort) =>
                  applyFilter({
                    sort: sort !== catalogSortValues[0] ? sort : null,
                  })
                }
                onMobileFiltersOpen={() => setIsMobileFiltersOpen(true)}
              />
            </div>

            <div
              aria-label={t("activeFiltersLabel")}
              className="flex flex-wrap items-center gap-2"
            >
              {activeChips.length > 0 ? (
                activeChips.map((chip) => (
                  <Button
                    key={chip.key}
                    type="button"
                    variant="outline"
                    onClick={chip.onRemove}
                    className="border-border/80 bg-surface-elevated hover:border-primary/35 hover:bg-surface-muted h-auto rounded-full px-3 py-1.5 shadow-xs"
                    aria-label={`${chip.label} - ${t("removeFilter")}`}
                  >
                    <span className="text-sm">{chip.label}</span>
                    <X className="size-3.5" aria-hidden />
                  </Button>
                ))
              ) : (
                <p className="text-muted-foreground text-sm leading-6">
                  {t("noActiveFilters")}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Desktop filters */}
        <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[minmax(290px,320px)_minmax(0,1fr)]">
          <aside className="hidden self-start lg:sticky lg:top-28 lg:block">
            <CatalogFilters
              categoryGroups={categoryGroups}
              selectedGroups={draftGroups}
              selectedCategories={draftCategories}
              selectedPlans={draftPlans}
              selectedFormats={draftFormats}
              showReset={hasActiveFilters}
              onGroupToggle={handleGroupToggle}
              onCategoryToggle={handleCategoryToggle}
              onPlanToggle={handlePlanToggle}
              onFormatToggle={handleFormatToggle}
              onApply={applyAllDrafts}
              onReset={handleReset}
              idPrefix="catalog-sidebar"
              filteredCount={hasDraft ? filteredCount : undefined}
              isCountFetching={hasDraft ? isCountFetching : undefined}
              hasDraft={hasDraft}
            />
          </aside>

          <div className="self-start">
            <CatalogResults
              page={page}
              sort={selectedSort}
              search={activeSearch}
              groups={
                selectedCategories.length === 0 && selectedGroups.length > 0
                  ? selectedGroups
                  : undefined
              }
              categories={
                selectedCategories.length > 0 ? selectedCategories : undefined
              }
              plans={selectedPlans.length > 0 ? selectedPlans : undefined}
              formats={selectedFormats.length > 0 ? selectedFormats : undefined}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Mobile filters sheet */}
      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent
          side="left"
          className="flex w-full max-w-md flex-col overflow-hidden p-0"
        >
          <SheetHeader className="border-border/60 shrink-0 border-b p-4">
            <SheetTitle>{t("filtersPanel.title")}</SheetTitle>
            <SheetDescription>{t("filtersPanel.description")}</SheetDescription>
          </SheetHeader>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto p-4">
            <CatalogFilters
              categoryGroups={categoryGroups}
              selectedGroups={draftGroups}
              selectedCategories={draftCategories}
              selectedPlans={draftPlans}
              selectedFormats={draftFormats}
              showReset={hasActiveFilters}
              onGroupToggle={handleGroupToggle}
              onCategoryToggle={handleCategoryToggle}
              onPlanToggle={handlePlanToggle}
              onFormatToggle={handleFormatToggle}
              onReset={handleReset}
              idPrefix="catalog-mobile-sheet"
            />
          </div>

          {/* Sticky count button — applies all draft filters at once */}
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

export default CatalogShell;
