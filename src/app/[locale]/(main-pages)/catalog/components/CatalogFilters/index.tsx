"use client";

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
import {
  type CatalogFilterOption,
  type CatalogFormatValue,
  type CatalogPlanKey,
  type CatalogShellContent,
} from "../../types/catalog";

type CatalogFiltersProps = {
  categories: CatalogFilterOption[];
  planOptions: CatalogFilterOption<CatalogPlanKey>[];
  formatOptions: CatalogFilterOption<CatalogFormatValue>[];
  content: CatalogShellContent;
  selectedCategories: string[];
  selectedPlans: CatalogPlanKey[];
  selectedFormats: CatalogFormatValue[];
  showReset: boolean;
  onCategoryToggle: (value: string) => void;
  onPlanToggle: (value: CatalogPlanKey) => void;
  onFormatToggle: (value: CatalogFormatValue) => void;
  onReset: () => void;
  idPrefix?: string;
  className?: string;
};

function CatalogFilters({
  categories,
  planOptions,
  formatOptions,
  content,
  selectedCategories,
  selectedPlans,
  selectedFormats,
  showReset,
  onCategoryToggle,
  onPlanToggle,
  onFormatToggle,
  onReset,
  idPrefix = "catalog-filters",
  className,
}: CatalogFiltersProps) {
  return (
    <div
      aria-label={content.filtersPanel.title}
      className={cn(
        "border-border/60 bg-background/78 flex flex-col gap-6 rounded-[2rem] border p-5 shadow-[0_26px_90px_hsl(var(--foreground)/0.07)] backdrop-blur-xl sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {content.filtersPanel.title}
          </h2>
          {content.filtersPanel.description ? (
            <p className="text-muted-foreground text-sm leading-6">
              {content.filtersPanel.description}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!showReset}
          className="rounded-full px-3"
        >
          <RefreshCcw className="size-3.5" aria-hidden />
          {content.resetFilters}
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
            <div className="flex flex-1 items-start justify-between gap-3 pr-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold tracking-[0.12em] uppercase">
                  {content.filters.category.title}
                </span>
                {content.filters.category.description ? (
                  <span className="text-muted-foreground text-xs leading-5">
                    {content.filters.category.description}
                  </span>
                ) : null}
              </div>
              {selectedCategories.length > 0 ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-1 text-xs"
                >
                  {selectedCategories.length}
                </Badge>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            {categories.length > 0 ? (
              <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                {categories.map((category) => {
                  const inputId = `${idPrefix}-category-${category.value}`;
                  const isChecked = selectedCategories.includes(category.value);

                  return (
                    <label
                      key={category.value}
                      htmlFor={inputId}
                      className={cn(
                        "hover:bg-muted/55 border-border/60 flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors",
                        isChecked && "border-primary/30 bg-primary/8",
                      )}
                    >
                      <Checkbox
                        id={inputId}
                        checked={isChecked}
                        onCheckedChange={() => onCategoryToggle(category.value)}
                        className="mt-0.5"
                      />
                      <span className="text-sm font-medium">
                        {category.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground bg-muted/55 rounded-2xl px-4 py-3 text-sm leading-6">
                {content.filters.category.empty}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="plan" className="border-border/60">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex flex-1 items-start justify-between gap-3 pr-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold tracking-[0.12em] uppercase">
                  {content.filters.plan.title}
                </span>
                {content.filters.plan.description ? (
                  <span className="text-muted-foreground text-xs leading-5">
                    {content.filters.plan.description}
                  </span>
                ) : null}
              </div>
              {selectedPlans.length > 0 ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-1 text-xs"
                >
                  {selectedPlans.length}
                </Badge>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <div className="flex flex-col gap-2.5">
              {planOptions.map((option) => {
                const inputId = `${idPrefix}-plan-${option.value}`;
                const isChecked = selectedPlans.includes(option.value);

                return (
                  <label
                    key={option.value}
                    htmlFor={inputId}
                    className={cn(
                      "hover:bg-muted/55 border-border/60 flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors",
                      isChecked && "border-primary/30 bg-primary/8",
                    )}
                  >
                    <Checkbox
                      id={inputId}
                      checked={isChecked}
                      onCheckedChange={() => onPlanToggle(option.value)}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="text-muted-foreground text-xs leading-5">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="format" className="border-border/60">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex flex-1 items-start justify-between gap-3 pr-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold tracking-[0.12em] uppercase">
                  {content.filters.format.title}
                </span>
                {content.filters.format.description ? (
                  <span className="text-muted-foreground text-xs leading-5">
                    {content.filters.format.description}
                  </span>
                ) : null}
              </div>
              {selectedFormats.length > 0 ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-1 text-xs"
                >
                  {selectedFormats.length}
                </Badge>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <div className="flex flex-col gap-2.5">
              {formatOptions.map((option) => {
                const inputId = `${idPrefix}-format-${option.value}`;
                const isChecked = selectedFormats.includes(option.value);

                return (
                  <label
                    key={option.value}
                    htmlFor={inputId}
                    className={cn(
                      "hover:bg-muted/55 border-border/60 flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors",
                      isChecked && "border-primary/30 bg-primary/8",
                    )}
                  >
                    <Checkbox
                      id={inputId}
                      checked={isChecked}
                      onCheckedChange={() => onFormatToggle(option.value)}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium uppercase">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="text-muted-foreground text-xs leading-5">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default CatalogFilters;
