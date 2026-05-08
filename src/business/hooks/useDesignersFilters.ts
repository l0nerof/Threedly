"use client";

import {
  type DesignerLevel,
  type DesignerSortValue,
  type DesignerSpecialization,
  designerLevelValues,
  designerSortValues,
  designerSpecializationValues,
} from "@/src/business/types/designer";
import { haveSameValues } from "@/src/business/utils/catalogFilters";
import {
  parseListParam,
  useUrlFilters,
} from "@/src/shared/hooks/use-url-filters";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export type ActiveChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

export type DesignersFiltersState = {
  page: number;
  selectedSort: DesignerSortValue;
  selectedSpecializations: DesignerSpecialization[];
  selectedLevels: DesignerLevel[];
  draftSpecializations: DesignerSpecialization[];
  draftLevels: DesignerLevel[];
  searchValue: string;
  activeSearch: string | undefined;
  hasActiveFilters: boolean;
  hasCommittedFilters: boolean;
  hasDraft: boolean;
  activeChips: ActiveChip[];
  setSearchValue: (v: string) => void;
  handleSpecializationToggle: (v: DesignerSpecialization) => void;
  handleLevelToggle: (v: DesignerLevel) => void;
  applyAllDrafts: () => void;
  handleReset: () => void;
  setPage: (page: number) => void;
  applyFilter: (params: Record<string, string | null>) => void;
};

export function useDesignersFilters(): DesignersFiltersState {
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const selectedSort =
    parseListParam(searchParams.get("sort"), designerSortValues)[0] ??
    designerSortValues[0];

  const specializationsParam = searchParams.get("specializations") ?? "";
  const levelsParam = searchParams.get("levels") ?? "";
  const selectedSpecializations = parseListParam(
    specializationsParam,
    designerSpecializationValues,
  );
  const selectedLevels = parseListParam(levelsParam, designerLevelValues);

  const [draftSpecializations, setDraftSpecializations] = useState<
    DesignerSpecialization[]
  >(selectedSpecializations);
  const [draftLevels, setDraftLevels] =
    useState<DesignerLevel[]>(selectedLevels);

  useEffect(() => {
    setDraftSpecializations(
      parseListParam(specializationsParam, designerSpecializationValues),
    );
  }, [specializationsParam]);

  useEffect(() => {
    setDraftLevels(parseListParam(levelsParam, designerLevelValues));
  }, [levelsParam]);

  const {
    searchValue,
    setSearchValue,
    activeSearch,
    applyFilter,
    setPage,
    resetAll,
  } = useUrlFilters();

  const handleSpecializationToggle = (value: DesignerSpecialization) => {
    setDraftSpecializations((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  const handleLevelToggle = (value: DesignerLevel) => {
    setDraftLevels((prev) =>
      prev.includes(value) ? prev.filter((l) => l !== value) : [...prev, value],
    );
  };

  const applyAllDrafts = () => {
    applyFilter({
      specializations:
        draftSpecializations.length > 0 ? draftSpecializations.join(",") : null,
      levels: draftLevels.length > 0 ? draftLevels.join(",") : null,
    });
  };

  const handleReset = () => {
    setDraftSpecializations([]);
    setDraftLevels([]);
    resetAll();
  };

  const urlSearch = searchParams.get("q") ?? "";

  const hasCommittedFilters =
    urlSearch.length > 0 ||
    selectedSpecializations.length > 0 ||
    selectedLevels.length > 0;

  const hasActiveFilters =
    hasCommittedFilters ||
    draftSpecializations.length > 0 ||
    draftLevels.length > 0;

  const hasDraft =
    !haveSameValues(draftSpecializations, selectedSpecializations) ||
    !haveSameValues(draftLevels, selectedLevels);

  const activeChips: ActiveChip[] = [
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
    ...selectedSpecializations.map((spec) => ({
      key: `spec-${spec}`,
      label: spec,
      onRemove: () => {
        const next = selectedSpecializations.filter((s) => s !== spec);
        setDraftSpecializations(next);
        applyFilter({ specializations: next.join(",") || null });
      },
    })),
    ...selectedLevels.map((level) => ({
      key: `level-${level}`,
      label: level,
      onRemove: () => {
        const next = selectedLevels.filter((l) => l !== level);
        setDraftLevels(next);
        applyFilter({ levels: next.join(",") || null });
      },
    })),
  ].filter((chip): chip is ActiveChip => chip !== null);

  return {
    page,
    selectedSort,
    selectedSpecializations,
    selectedLevels,
    draftSpecializations,
    draftLevels,
    searchValue,
    activeSearch,
    hasActiveFilters,
    hasCommittedFilters,
    hasDraft,
    activeChips,
    setSearchValue,
    handleSpecializationToggle,
    handleLevelToggle,
    applyAllDrafts,
    handleReset,
    setPage,
    applyFilter,
  };
}
