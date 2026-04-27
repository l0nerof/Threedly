import {
  catalogFormatValues,
  catalogPlanKeys,
} from "@/src/business/constants/catalogConfig";
import {
  type CatalogFilterOption,
  type CatalogFormatValue,
  type CatalogPlanKey,
} from "@/src/business/types/catalog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/components/Accordion";
import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import { Checkbox } from "@/src/shared/components/Checkbox";
import { Separator } from "@/src/shared/components/Separator";
import { cn } from "@/src/shared/utils/cn";
import { RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type FilterSection = "category" | "plan" | "format";

type CatalogFiltersProps = {
  categories: CatalogFilterOption[];
  selectedCategories: string[];
  selectedPlans: CatalogPlanKey[];
  selectedFormats: CatalogFormatValue[];
  showReset: boolean;
  onCategoryToggle: (value: string) => void;
  onPlanToggle: (value: CatalogPlanKey) => void;
  onFormatToggle: (value: CatalogFormatValue) => void;
  onApply?: () => void;
  onReset: () => void;
  idPrefix?: string;
  filteredCount?: number;
  isCountFetching?: boolean;
  hasCategoryDraft?: boolean;
  hasPlanDraft?: boolean;
  hasFormatDraft?: boolean;
};

function CatalogFilters({
  categories,
  selectedCategories,
  selectedPlans,
  selectedFormats,
  showReset,
  onCategoryToggle,
  onPlanToggle,
  onFormatToggle,
  onApply,
  onReset,
  idPrefix = "catalog-filters",
  filteredCount,
  isCountFetching,
  hasCategoryDraft = false,
  hasPlanDraft = false,
  hasFormatDraft = false,
}: CatalogFiltersProps) {
  const t = useTranslations("Catalog");

  const [sectionOrder, setSectionOrder] = useState<FilterSection[]>([]);

  const touchSection = (section: FilterSection) => {
    setSectionOrder((prev) => [...prev.filter((s) => s !== section), section]);
  };

  const handleCategoryToggle = (value: string) => {
    touchSection("category");
    onCategoryToggle(value);
  };

  const handlePlanToggle = (value: CatalogPlanKey) => {
    touchSection("plan");
    onPlanToggle(value);
  };

  const handleFormatToggle = (value: CatalogFormatValue) => {
    touchSection("format");
    onFormatToggle(value);
  };

  // Button shows only where there are uncommitted changes (draft ≠ URL)
  const sectionHasDraft: Record<FilterSection, boolean> = {
    category: hasCategoryDraft,
    plan: hasPlanDraft,
    format: hasFormatDraft,
  };

  // Most recently interacted section that still has uncommitted changes
  const activeSection =
    [...sectionOrder].reverse().find((s) => sectionHasDraft[s]) ?? null;

  const showButtonIn = (section: FilterSection) =>
    onApply !== undefined && activeSection === section;

  const countLabel = isCountFetching
    ? t("filtersPanel.countLoading")
    : t("filtersPanel.showCount", { count: filteredCount ?? 0 });

  return (
    <div
      aria-label={t("filtersPanel.title")}
      className="border-border/60 bg-surface/95 flex flex-col gap-6 rounded-4xl border p-5 shadow-[0_26px_90px_hsl(var(--foreground)/0.07)] backdrop-blur-xl sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("filtersPanel.title")}
          </h2>
          <p className="text-muted-foreground text-sm leading-6">
            {t("filtersPanel.description")}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!showReset}
          className="h-8 rounded-full px-3 text-xs"
        >
          <RefreshCcw className="size-3.5" aria-hidden />
          {t("resetFilters")}
        </Button>
      </div>

      <Separator />

      <Accordion
        type="multiple"
        defaultValue={["category", "plan", "format"]}
        className="flex flex-col"
      >
        <AccordionItem value="category" className="border-border/60">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex flex-1 items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold tracking-[0.12em] uppercase">
                  {t("filters.category.title")}
                </span>
                <span className="text-muted-foreground text-xs leading-5">
                  {t("filters.category.description")}
                </span>
              </div>

              {selectedCategories.length > 0 ? (
                <Badge
                  variant="secondary"
                  className="flex size-6 items-center justify-center rounded-full text-xs"
                >
                  {selectedCategories.length}
                </Badge>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {categories.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                  {categories.map((category) => {
                    const inputId = `${idPrefix}-category-${category.value}`;
                    const isChecked = selectedCategories.includes(
                      category.value,
                    );

                    return (
                      <label
                        key={category.value}
                        htmlFor={inputId}
                        className={cn(
                          "border-border/70 bg-surface-elevated/55 hover:border-primary/35 hover:bg-primary/8 flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors",
                          isChecked && "border-primary/45 bg-primary/10",
                        )}
                      >
                        <Checkbox
                          id={inputId}
                          checked={isChecked}
                          onCheckedChange={() =>
                            handleCategoryToggle(category.value)
                          }
                          className="mt-0.5"
                        />
                        <span className="text-sm font-medium">
                          {category.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {showButtonIn("category") && (
                  <Button
                    type="button"
                    className="h-10 w-full"
                    onClick={onApply}
                    disabled={isCountFetching}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {countLabel}
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground bg-muted/55 rounded-2xl px-4 py-3 text-sm leading-6">
                {t("filters.category.empty")}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="plan" className="border-border/60">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex flex-1 items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold tracking-[0.12em] uppercase">
                  {t("filters.plan.title")}
                </span>
                <span className="text-muted-foreground text-xs leading-5">
                  {t("filters.plan.description")}
                </span>
              </div>

              {selectedPlans.length > 0 ? (
                <Badge
                  variant="secondary"
                  className="flex size-6 items-center justify-center rounded-full text-xs"
                >
                  {selectedPlans.length}
                </Badge>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2.5">
                {catalogPlanKeys.map((planKey) => {
                  const inputId = `${idPrefix}-plan-${planKey}`;
                  const isChecked = selectedPlans.includes(planKey);

                  return (
                    <label
                      key={planKey}
                      htmlFor={inputId}
                      className={cn(
                        "border-border/70 bg-surface-elevated/55 hover:border-primary/35 hover:bg-primary/8 flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors",
                        isChecked && "border-primary/45 bg-primary/10",
                      )}
                    >
                      <Checkbox
                        id={inputId}
                        checked={isChecked}
                        onCheckedChange={() => handlePlanToggle(planKey)}
                        className="mt-0.5"
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {t(`filters.plan.options.${planKey}.label`)}
                        </span>
                        <span className="text-muted-foreground text-xs leading-5">
                          {t(`filters.plan.options.${planKey}.description`)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {showButtonIn("plan") && (
                <Button
                  type="button"
                  className="h-10 w-full"
                  onClick={onApply}
                  disabled={isCountFetching}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {countLabel}
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="format" className="border-border/60">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex flex-1 items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold tracking-[0.12em] uppercase">
                  {t("filters.format.title")}
                </span>
                <span className="text-muted-foreground text-xs leading-5">
                  {t("filters.format.description")}
                </span>
              </div>

              {selectedFormats.length > 0 ? (
                <Badge
                  variant="secondary"
                  className="flex size-6 items-center justify-center rounded-full text-xs"
                >
                  {selectedFormats.length}
                </Badge>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2.5">
                {catalogFormatValues.map((formatValue) => {
                  const inputId = `${idPrefix}-format-${formatValue}`;
                  const isChecked = selectedFormats.includes(formatValue);

                  return (
                    <label
                      key={formatValue}
                      htmlFor={inputId}
                      className={cn(
                        "border-border/70 bg-surface-elevated/55 hover:border-primary/35 hover:bg-primary/8 flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors",
                        isChecked && "border-primary/45 bg-primary/10",
                      )}
                    >
                      <Checkbox
                        id={inputId}
                        checked={isChecked}
                        onCheckedChange={() => handleFormatToggle(formatValue)}
                        className="mt-0.5"
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium uppercase">
                          {t(`filters.format.options.${formatValue}.label`)}
                        </span>
                        <span className="text-muted-foreground text-xs leading-5">
                          {t(
                            `filters.format.options.${formatValue}.description`,
                          )}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {showButtonIn("format") && (
                <Button
                  type="button"
                  className="h-10 w-full"
                  onClick={onApply}
                  disabled={isCountFetching}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {countLabel}
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default CatalogFilters;
