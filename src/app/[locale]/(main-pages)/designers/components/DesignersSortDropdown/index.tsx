"use client";

import {
  type DesignerSortValue,
  designerSortValues,
} from "@/src/business/types/designer";
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
import { ArrowDownWideNarrow, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

type DesignersSortDropdownProps = {
  selectedSort: DesignerSortValue;
  onSortChange: (value: DesignerSortValue) => void;
  onMobileFiltersOpen: () => void;
};

function DesignersSortDropdown({
  selectedSort,
  onSortChange,
  onMobileFiltersOpen,
}: DesignersSortDropdownProps) {
  const tResults = useTranslations("Designers.results");
  const tShell = useTranslations("Designers.shell");
  const selectedSortLabel = tResults(`sort.${selectedSort}`);

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="border-border/60 h-12 rounded-full px-4"
            aria-label={`${tResults("sortLabel")}: ${selectedSortLabel}`}
          >
            <ArrowDownWideNarrow className="size-4" aria-hidden />
            <span className="font-medium">{selectedSortLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 rounded-2xl p-0">
          <DropdownMenuLabel className="px-3 py-3 text-xs tracking-[0.14em] uppercase">
            {tResults("sortLabel")}
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-0" />

          <DropdownMenuRadioGroup
            value={selectedSort}
            onValueChange={(value) => onSortChange(value as DesignerSortValue)}
          >
            {designerSortValues.map((sortValue) => (
              <DropdownMenuRadioItem
                key={sortValue}
                value={sortValue}
                className="cursor-pointer rounded-none py-3 pr-3 pl-8"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    {tResults(`sort.${sortValue}`)}
                  </span>
                  <span className="text-muted-foreground text-xs leading-5">
                    {tResults(`sortDescriptions.${sortValue}`)}
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
        onClick={onMobileFiltersOpen}
        className="border-border/60 h-12 rounded-full px-4 lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {tShell("filtersButton")}
      </Button>
    </div>
  );
}

export default DesignersSortDropdown;
