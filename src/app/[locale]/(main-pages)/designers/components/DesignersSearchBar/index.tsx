"use client";

import type { ActiveChip } from "@/src/business/hooks/useDesignersFilters";
import { Button } from "@/src/shared/components/Button";
import { Input } from "@/src/shared/components/Input";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

type DesignersSearchBarProps = {
  searchValue: string;
  activeChips: ActiveChip[];
  onSearchChange: (v: string) => void;
  onOpenMobileFilters: () => void;
};

function DesignersSearchBar({
  searchValue,
  activeChips,
  onSearchChange,
  onOpenMobileFilters,
}: DesignersSearchBarProps) {
  const t = useTranslations("Designers.shell");

  return (
    <header className="flex flex-col">
      <h1 className="sr-only">{t("pageTitle")}</h1>

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
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              className="border-border/60 bg-surface-elevated/90 h-12 rounded-full pr-4 pl-11 text-sm shadow-none"
            />
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={onOpenMobileFilters}
            className="border-border/60 h-12 rounded-full px-4 lg:hidden"
          >
            {t("filtersButton")}
          </Button>
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
                aria-label={t("removeFilter", { label: chip.label })}
              >
                <span className="text-sm capitalize">{chip.label}</span>
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
  );
}

export default DesignersSearchBar;
