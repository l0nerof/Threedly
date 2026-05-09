"use client";

import type { CategoryGroupOption } from "@/src/app/[locale]/(main-pages)/designers/actions";
import {
  type DesignerLevel,
  designerLevelValues,
} from "@/src/business/types/designer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/components/Accordion";
import { Badge } from "@/src/shared/components/Badge";
import { Button } from "@/src/shared/components/Button";
import { Checkbox } from "@/src/shared/components/Checkbox";
import { Label } from "@/src/shared/components/Label";
import { Separator } from "@/src/shared/components/Separator";
import { cn } from "@/src/shared/utils/cn";
import { RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";

type DesignersFiltersProps = {
  categoryGroups: CategoryGroupOption[];
  selectedSpecializations: string[];
  selectedLevels: DesignerLevel[];
  showReset: boolean;
  onSpecializationToggle: (value: string) => void;
  onLevelToggle: (value: DesignerLevel) => void;
  onApply?: () => void;
  onReset: () => void;
  idPrefix?: string;
  filteredCount?: number;
  isCountFetching?: boolean;
  hasDraft?: boolean;
};

function DesignersFilters({
  categoryGroups,
  selectedSpecializations,
  selectedLevels,
  showReset,
  onSpecializationToggle,
  onLevelToggle,
  onApply,
  onReset,
  idPrefix = "designers-filters",
  filteredCount,
  isCountFetching,
  hasDraft = false,
}: DesignersFiltersProps) {
  const t = useTranslations("Designers.filters");
  const countLabel = isCountFetching
    ? t("applyLoading")
    : t("applyButton", { count: filteredCount ?? 0 });

  return (
    <div
      aria-label="Filters"
      className="border-border/60 bg-surface/95 flex flex-col gap-6 rounded-4xl border p-5 shadow-[0_26px_90px_hsl(var(--foreground)/0.07)] backdrop-blur-xl sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground text-sm leading-6">
            {t("description")}
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
            {t("reset")}
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
        defaultValue={["specialization", "level"]}
        className="flex flex-col"
      >
        <AccordionItem value="specialization" className="border-border/60">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex flex-1 items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold tracking-[0.12em] uppercase">
                  {t("specialization.title")}
                </span>
                <span className="text-muted-foreground text-xs leading-5">
                  {t("specialization.description")}
                </span>
              </div>
              {selectedSpecializations.length > 0 && (
                <Badge
                  variant="secondary"
                  className="flex size-6 items-center justify-center rounded-full text-xs"
                >
                  {selectedSpecializations.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2.5">
              {categoryGroups.map((group) => {
                const inputId = `${idPrefix}-spec-${group.slug}`;
                const isChecked = selectedSpecializations.includes(group.slug);
                return (
                  <Label
                    key={group.slug}
                    htmlFor={inputId}
                    className={cn(
                      "border-border/70 bg-surface-elevated/55 hover:border-primary/35 hover:bg-primary/8 flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors",
                      isChecked && "border-primary/45 bg-primary/10",
                    )}
                  >
                    <Checkbox
                      id={inputId}
                      checked={isChecked}
                      onCheckedChange={() => onSpecializationToggle(group.slug)}
                    />
                    <span className="text-sm font-medium">{group.name_en}</span>
                  </Label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="level" className="border-border/60">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex flex-1 items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold tracking-[0.12em] uppercase">
                  {t("level.title")}
                </span>
                <span className="text-muted-foreground text-xs leading-5">
                  {t("level.description")}
                </span>
              </div>
              {selectedLevels.length > 0 && (
                <Badge
                  variant="secondary"
                  className="flex size-6 items-center justify-center rounded-full text-xs"
                >
                  {selectedLevels.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2.5">
              {designerLevelValues.map((level) => {
                const inputId = `${idPrefix}-level-${level}`;
                const isChecked = selectedLevels.includes(level);
                return (
                  <Label
                    key={level}
                    htmlFor={inputId}
                    className={cn(
                      "border-border/70 bg-surface-elevated/55 hover:border-primary/35 hover:bg-primary/8 flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors",
                      isChecked && "border-primary/45 bg-primary/10",
                    )}
                  >
                    <Checkbox
                      id={inputId}
                      checked={isChecked}
                      onCheckedChange={() => onLevelToggle(level)}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {t(`level.labels.${level}.label`)}
                      </span>
                      <span className="text-muted-foreground text-xs leading-5">
                        {t(`level.labels.${level}.description`)}
                      </span>
                    </span>
                  </Label>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default DesignersFilters;
