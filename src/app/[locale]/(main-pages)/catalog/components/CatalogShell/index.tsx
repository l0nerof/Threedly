"use client";

import { catalogSortValues } from "@/src/business/constants/catalogConfig";
import {
  type CatalogFilterOption,
  type CatalogFormatValue,
  type CatalogPlanKey,
  type CatalogSortValue,
} from "@/src/business/types/catalog";
import { Button } from "@/src/shared/components/Button";
import { Input } from "@/src/shared/components/Input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/Sheet";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  haveSameValues,
  resolveOptionLabel,
} from "../../../../../../business/utils/catalogFilters";
import CatalogFilters from "../CatalogFilters";
import CatalogResults from "../CatalogResults";
import CatalogSortDropdown from "../CatalogSortDropdown";

type CatalogShellProps = {
  categories: CatalogFilterOption[];
  initialCategories: string[];
};

function CatalogShell({ categories, initialCategories }: CatalogShellProps) {
  const t = useTranslations("Catalog");
  const defaultSort = catalogSortValues[0];

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);
  const [selectedPlans, setSelectedPlans] = useState<CatalogPlanKey[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<CatalogFormatValue[]>(
    [],
  );
  const [selectedSort, setSelectedSort] =
    useState<CatalogSortValue>(defaultSort);

  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const hasActiveFilters =
    searchValue.trim().length > 0 ||
    !haveSameValues(selectedCategories, initialCategories) ||
    selectedPlans.length > 0 ||
    selectedFormats.length > 0;

  const activeChips = [
    searchValue.trim()
      ? {
          key: `search-${searchValue.trim()}`,
          label: searchValue.trim(),
          onRemove: () => setSearchValue(""),
        }
      : null,
    ...selectedCategories.map((category) => ({
      key: `category-${category}`,
      label: resolveOptionLabel(categories, category),
      onRemove: () =>
        setSelectedCategories((current) =>
          current.filter((item) => item !== category),
        ),
    })),
    ...selectedPlans.map((plan) => ({
      key: `plan-${plan}`,
      label: t(`filters.plan.options.${plan}.label`),
      onRemove: () =>
        setSelectedPlans((current) =>
          current.filter((selectedPlan) => selectedPlan !== plan),
        ),
    })),
    ...selectedFormats.map((format) => ({
      key: `format-${format}`,
      label: t(`filters.format.options.${format}.label`),
      onRemove: () =>
        setSelectedFormats((current) =>
          current.filter((selectedFormat) => selectedFormat !== format),
        ),
    })),
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  const handleCategoryToggle = (value: string) => {
    setSelectedCategories((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handlePlanToggle = (value: CatalogPlanKey) => {
    setSelectedPlans((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handleFormatToggle = (value: CatalogFormatValue) => {
    setSelectedFormats((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handleReset = () => {
    setSearchValue("");
    setSelectedCategories(initialCategories);
    setSelectedPlans([]);
    setSelectedFormats([]);
    setSelectedSort(defaultSort);
  };

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
                onSortChange={(sort) => {
                  setSelectedSort(sort);
                  setPage(1);
                }}
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
          <aside className="hidden lg:block">
            <CatalogFilters
              categories={categories}
              selectedCategories={selectedCategories}
              selectedPlans={selectedPlans}
              selectedFormats={selectedFormats}
              showReset={hasActiveFilters}
              onCategoryToggle={handleCategoryToggle}
              onPlanToggle={handlePlanToggle}
              onFormatToggle={handleFormatToggle}
              onReset={handleReset}
              idPrefix="catalog-sidebar"
            />
          </aside>

          <CatalogResults
            page={page}
            sort={selectedSort}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Mobile filters sheet */}
      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent side="left" className="w-full max-w-md overflow-y-auto">
          <SheetHeader className="border-border/60 border-b pb-4">
            <SheetTitle>{t("filtersPanel.title")}</SheetTitle>
            <SheetDescription>{t("filtersPanel.description")}</SheetDescription>
          </SheetHeader>

          <div className="p-4">
            <CatalogFilters
              categories={categories}
              selectedCategories={selectedCategories}
              selectedPlans={selectedPlans}
              selectedFormats={selectedFormats}
              showReset={hasActiveFilters}
              onCategoryToggle={handleCategoryToggle}
              onPlanToggle={handlePlanToggle}
              onFormatToggle={handleFormatToggle}
              onReset={handleReset}
              idPrefix="catalog-mobile-sheet"
            />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default CatalogShell;
