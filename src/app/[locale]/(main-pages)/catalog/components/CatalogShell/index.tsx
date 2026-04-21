"use client";

import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/DropdownMenu";
import { Input } from "@/src/shared/components/Input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/Sheet";
import {
  ArrowDownWideNarrow,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  type CatalogFilterOption,
  type CatalogFormatValue,
  type CatalogPlanKey,
  type CatalogShellContent,
  type CatalogSortOption,
  type CatalogSortValue,
} from "../../types/catalog";
import CatalogFilters from "../CatalogFilters";
import CatalogResultsCanvas from "../CatalogResultsCanvas";

type CatalogShellProps = {
  categories: CatalogFilterOption[];
  planOptions: CatalogFilterOption<CatalogPlanKey>[];
  formatOptions: CatalogFilterOption<CatalogFormatValue>[];
  sortOptions: CatalogSortOption[];
  initialCategories: string[];
  content: CatalogShellContent;
};

function resolveOptionLabel(
  options: CatalogFilterOption[],
  value: string,
): string {
  const match = options.find((option) => option.value === value);

  if (match?.label) {
    return match.label;
  }

  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function haveSameValues(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();

  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function CatalogShell({
  categories,
  planOptions,
  formatOptions,
  sortOptions,
  initialCategories,
  content,
}: CatalogShellProps) {
  const defaultSort = sortOptions[0]?.value ?? "curated";

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

  const hasActiveFilters =
    searchValue.trim().length > 0 ||
    !haveSameValues(selectedCategories, initialCategories) ||
    selectedPlans.length > 0 ||
    selectedFormats.length > 0;

  const selectedSortLabel =
    sortOptions.find((option) => option.value === selectedSort)?.label ??
    sortOptions[0]?.label;

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
      label: resolveOptionLabel(planOptions, plan),
      onRemove: () =>
        setSelectedPlans((current) =>
          current.filter((selectedPlan) => selectedPlan !== plan),
        ),
    })),
    ...selectedFormats.map((format) => ({
      key: `format-${format}`,
      label: resolveOptionLabel(formatOptions, format),
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
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_center,hsl(var(--primary)/0.18),transparent_58%)]"
      />
      <div
        aria-hidden
        className="bg-background/80 absolute inset-x-[14%] top-14 h-48 rounded-full blur-3xl"
      />

      <div className="relative container flex flex-col gap-10 py-28 sm:gap-12 sm:py-32">
        <header className="flex flex-col gap-6">
          <div className="mx-auto flex max-w-4xl flex-col items-start gap-5 text-left">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary rounded-full px-4 py-1.5 text-[0.72rem] tracking-[0.16em] uppercase"
            >
              {content.badge}
            </Badge>

            <div className="flex flex-col gap-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                {content.title}
              </h1>
              <p className="text-muted-foreground max-w-3xl text-base leading-7 sm:text-lg">
                {content.subtitle}
              </p>
            </div>
          </div>

          <div className="border-border/60 bg-background/78 rounded-[2rem] border p-4 shadow-[0_26px_90px_hsl(var(--foreground)/0.07)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <span className="sr-only">{content.searchLabel}</span>
                <Search
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
                />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={content.searchPlaceholder}
                  aria-label={content.searchLabel}
                  className="border-border/60 bg-background/85 h-12 rounded-full pr-4 pl-11 text-sm shadow-none"
                />
              </label>

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border/60 h-12 rounded-full px-4"
                      aria-label={`${content.sortLabel}: ${selectedSortLabel ?? ""}`}
                    >
                      <ArrowDownWideNarrow className="size-4" aria-hidden />
                      <span className="hidden sm:inline">
                        {content.sortLabel}
                      </span>
                      <span className="font-medium">{selectedSortLabel}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 rounded-2xl p-2"
                  >
                    <DropdownMenuLabel className="px-3 pt-2 pb-1 text-xs tracking-[0.14em] uppercase">
                      {content.sortLabel}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={selectedSort}
                      onValueChange={(value) =>
                        setSelectedSort(value as CatalogSortValue)
                      }
                    >
                      {sortOptions.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                          className="rounded-xl py-3 pr-3 pl-8"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-muted-foreground text-xs leading-5">
                              {option.description}
                            </span>
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="border-border/60 h-12 rounded-full px-4 lg:hidden"
                >
                  <SlidersHorizontal className="size-4" aria-hidden />
                  {content.mobileFiltersButton}
                </Button>
              </div>
            </div>

            <div
              aria-label={content.activeFiltersLabel}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              {activeChips.length > 0 ? (
                activeChips.map((chip) => (
                  <Button
                    key={chip.key}
                    type="button"
                    variant="secondary"
                    onClick={chip.onRemove}
                    className="bg-muted hover:bg-muted/90 h-auto rounded-full px-3 py-1.5"
                    aria-label={`${chip.label} - ${content.removeFilter}`}
                  >
                    <span className="text-sm">{chip.label}</span>
                    <X className="size-3.5" aria-hidden />
                  </Button>
                ))
              ) : (
                <p className="text-muted-foreground text-sm leading-6">
                  {content.noActiveFilters}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[minmax(290px,320px)_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <CatalogFilters
              className="sticky top-28"
              categories={categories}
              planOptions={planOptions}
              formatOptions={formatOptions}
              content={content}
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

          <CatalogResultsCanvas content={content.resultsArea} />
        </div>
      </div>

      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent side="left" className="w-full max-w-md overflow-y-auto">
          <SheetHeader className="border-border/60 border-b pb-4">
            <SheetTitle>{content.filtersPanel.title}</SheetTitle>
            <SheetDescription>
              {content.filtersPanel.description}
            </SheetDescription>
          </SheetHeader>

          <div className="p-4">
            <CatalogFilters
              categories={categories}
              planOptions={planOptions}
              formatOptions={formatOptions}
              content={content}
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
