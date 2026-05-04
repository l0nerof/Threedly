import {
  catalogFormatValues,
  catalogPlanKeys,
} from "@/src/business/constants/catalogConfig";
import {
  type CatalogFormatValue,
  type CatalogPlanKey,
} from "@/src/business/types/catalog";
import type { CategoryGroupOption } from "@/src/business/types/category";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/components/Accordion";
import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import { Checkbox } from "@/src/shared/components/Checkbox";
import { Input } from "@/src/shared/components/Input";
import { Label } from "@/src/shared/components/Label";
import { Separator } from "@/src/shared/components/Separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/Sheet";
import { cn } from "@/src/shared/utils/cn";
import { RefreshCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type CatalogFiltersProps = {
  categoryGroups: CategoryGroupOption[];
  selectedGroups: string[];
  selectedCategories: string[];
  selectedPlans: CatalogPlanKey[];
  selectedFormats: CatalogFormatValue[];
  showReset: boolean;
  onGroupToggle: (value: string) => void;
  onCategoryToggle: (value: string) => void;
  onPlanToggle: (value: CatalogPlanKey) => void;
  onFormatToggle: (value: CatalogFormatValue) => void;
  onApply?: () => void;
  onReset: () => void;
  idPrefix?: string;
  filteredCount?: number;
  isCountFetching?: boolean;
  hasDraft?: boolean;
};

function CatalogFilters({
  categoryGroups,
  selectedGroups,
  selectedCategories,
  selectedPlans,
  selectedFormats,
  showReset,
  onGroupToggle,
  onCategoryToggle,
  onPlanToggle,
  onFormatToggle,
  onApply,
  onReset,
  idPrefix = "catalog-filters",
  filteredCount,
  isCountFetching,
  hasDraft = false,
}: CatalogFiltersProps) {
  const t = useTranslations("Catalog");
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const selectedCategoryCount =
    selectedCategories.length + selectedGroups.length;
  const categorySearchInputId = `${idPrefix}-category-search`;
  const normalizedCategorySearch = categorySearch.trim().toLocaleLowerCase();
  const filteredCategoryGroups = useMemo(() => {
    if (!normalizedCategorySearch) return categoryGroups;

    return categoryGroups.flatMap((group) => {
      const groupMatches = group.label
        .toLocaleLowerCase()
        .includes(normalizedCategorySearch);
      const categories = groupMatches
        ? group.categories
        : group.categories.filter((category) =>
            category.label
              .toLocaleLowerCase()
              .includes(normalizedCategorySearch),
          );

      if (!groupMatches && categories.length === 0) return [];

      return [{ ...group, categories }];
    });
  }, [categoryGroups, normalizedCategorySearch]);

  const countLabel = isCountFetching
    ? t("filtersPanel.countLoading")
    : t("filtersPanel.showCount", { count: filteredCount ?? 0 });

  return (
    <div
      aria-label={t("filtersPanel.title")}
      className="border-border/60 bg-surface/95 flex flex-col gap-6 rounded-4xl border p-5 shadow-[0_26px_90px_hsl(var(--foreground)/0.07)] backdrop-blur-xl sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("filtersPanel.title")}
          </h2>
          <p className="text-muted-foreground text-sm leading-6">
            {t("filtersPanel.description")}
          </p>
        </div>

        <div className="flex min-w-[7rem] shrink-0 flex-col items-stretch gap-2">
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

          {onApply !== undefined && hasDraft && (
            <Button
              type="button"
              size="sm"
              onClick={onApply}
              disabled={isCountFetching}
              className="h-8 rounded-full px-3 text-xs"
              aria-live="polite"
              aria-atomic="true"
            >
              {countLabel}
            </Button>
          )}
        </div>
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

              {selectedCategoryCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="flex size-6 items-center justify-center rounded-full text-xs"
                >
                  {selectedCategoryCount}
                </Badge>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {categoryGroups.length > 0 ? (
              <div className="py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full px-3 text-xs"
                  onClick={() => setIsCategoryPickerOpen(true)}
                >
                  {t("filters.category.pickerButton")}
                </Button>
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
            <div className="flex flex-col gap-2.5">
              {catalogPlanKeys.map((planKey) => {
                const inputId = `${idPrefix}-plan-${planKey}`;
                const isChecked = selectedPlans.includes(planKey);

                return (
                  <Label
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
                      onCheckedChange={() => onPlanToggle(planKey)}
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
                  </Label>
                );
              })}
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
            <div className="flex flex-col gap-2.5">
              {catalogFormatValues.map((formatValue) => {
                const inputId = `${idPrefix}-format-${formatValue}`;
                const isChecked = selectedFormats.includes(formatValue);

                return (
                  <Label
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
                      onCheckedChange={() => onFormatToggle(formatValue)}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium uppercase">
                        {t(`filters.format.options.${formatValue}.label`)}
                      </span>
                      <span className="text-muted-foreground text-xs leading-5">
                        {t(`filters.format.options.${formatValue}.description`)}
                      </span>
                    </span>
                  </Label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Sheet
        open={isCategoryPickerOpen}
        onOpenChange={(open) => {
          setIsCategoryPickerOpen(open);

          if (!open) {
            setCategorySearch("");
          }
        }}
      >
        <SheetContent
          side="left"
          className="flex w-full max-w-xl flex-col overflow-hidden p-0"
        >
          <SheetHeader className="border-border/60 shrink-0 border-b p-4 sm:p-6">
            <SheetTitle>{t("filters.category.pickerTitle")}</SheetTitle>
            <SheetDescription>
              {t("filters.category.pickerDescription")}
            </SheetDescription>
          </SheetHeader>

          <div className="border-border/60 shrink-0 border-b p-4 sm:p-6">
            <Label htmlFor={categorySearchInputId} className="relative block">
              <span className="sr-only">
                {t("filters.category.searchPlaceholder")}
              </span>
              <Search
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
              />
              <Input
                id={categorySearchInputId}
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder={t("filters.category.searchPlaceholder")}
                className="border-border/60 bg-surface-elevated/90 h-11 rounded-full pr-4 pl-11 text-sm shadow-none"
              />
            </Label>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {filteredCategoryGroups.length > 0 ? (
              <div className="flex flex-col gap-4">
                {filteredCategoryGroups.map((group) => {
                  const groupInputId = `${idPrefix}-picker-group-${group.value}`;
                  const isGroupChecked =
                    selectedGroups.includes(group.value) &&
                    selectedCategories.length === 0;

                  return (
                    <div
                      key={group.value}
                      className="border-border/60 flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      <Label
                        htmlFor={groupInputId}
                        className={cn(
                          "hover:border-primary/35 hover:bg-primary/8 flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors",
                          isGroupChecked && "border-primary/45 bg-primary/10",
                        )}
                      >
                        <Checkbox
                          id={groupInputId}
                          checked={isGroupChecked}
                          onCheckedChange={() => onGroupToggle(group.value)}
                          className="mt-0.5"
                        />
                        <span className="text-sm font-semibold">
                          {group.label}
                        </span>
                      </Label>

                      <div className="flex flex-col gap-1 pl-6">
                        {group.categories.map((category) => {
                          const inputId = `${idPrefix}-picker-category-${category.value}`;
                          const isChecked = selectedCategories.includes(
                            category.value,
                          );

                          return (
                            <Label
                              key={category.value}
                              htmlFor={inputId}
                              className={cn(
                                "hover:border-primary/35 hover:bg-primary/8 flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-2.5 py-1.5 transition-colors",
                                isChecked && "border-primary/45 bg-primary/10",
                              )}
                            >
                              <Checkbox
                                id={inputId}
                                checked={isChecked}
                                onCheckedChange={() =>
                                  onCategoryToggle(category.value)
                                }
                                className="mt-0.5"
                              />
                              <span className="text-sm font-medium">
                                {category.label}
                              </span>
                            </Label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground bg-muted/55 rounded-2xl px-4 py-3 text-sm leading-6">
                {t("filters.category.emptySearch")}
              </p>
            )}
          </div>

          <SheetFooter className="border-border/60 shrink-0 border-t p-4 sm:p-6">
            <Button
              type="button"
              className="w-full rounded-full"
              onClick={() => setIsCategoryPickerOpen(false)}
            >
              {t("filters.category.pickerDone")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default CatalogFilters;
