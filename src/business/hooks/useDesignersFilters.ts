"use client";

import {
  type DesignerCategoryGroupOption,
  type DesignerLevel,
  type DesignerSortValue,
  designerLevelValues,
  designerSortValues,
} from "@/src/business/types/designer";
import {
  haveSameValues,
  resolveOptionLabel,
} from "@/src/business/utils/catalogFilters";
import {
  parseListParam,
  splitParam,
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
  selectedGroups: string[];
  selectedLevels: DesignerLevel[];
  draftGroups: string[];
  draftLevels: DesignerLevel[];
  searchValue: string;
  activeSearch: string | undefined;
  hasActiveFilters: boolean;
  hasCommittedFilters: boolean;
  hasDraft: boolean;
  activeChips: ActiveChip[];
  setSearchValue: (v: string) => void;
  handleGroupToggle: (v: string) => void;
  handleLevelToggle: (v: DesignerLevel) => void;
  applyAllDrafts: () => void;
  handleReset: () => void;
  setPage: (page: number) => void;
  applyFilter: (params: Record<string, string | null>) => void;
};

export function useDesignersFilters(
  categoryGroups: DesignerCategoryGroupOption[],
): DesignersFiltersState {
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const selectedSort =
    parseListParam(searchParams.get("sort"), designerSortValues)[0] ??
    designerSortValues[0];

  const groupsParam = searchParams.get("groups") ?? "";
  const levelsParam = searchParams.get("levels") ?? "";
  const selectedGroups = splitParam(groupsParam);
  const selectedLevels = parseListParam(levelsParam, designerLevelValues);

  const [draftGroups, setDraftGroups] = useState<string[]>(selectedGroups);
  const [draftLevels, setDraftLevels] =
    useState<DesignerLevel[]>(selectedLevels);

  useEffect(() => {
    setDraftGroups(splitParam(groupsParam));
  }, [groupsParam]);

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

  const handleGroupToggle = (value: string) => {
    setDraftGroups((prev) =>
      prev.includes(value)
        ? prev.filter((group) => group !== value)
        : [...prev, value],
    );
  };

  const handleLevelToggle = (value: DesignerLevel) => {
    setDraftLevels((prev) =>
      prev.includes(value) ? prev.filter((l) => l !== value) : [...prev, value],
    );
  };

  const applyAllDrafts = () => {
    applyFilter({
      groups: draftGroups.length > 0 ? draftGroups.join(",") : null,
      levels: draftLevels.length > 0 ? draftLevels.join(",") : null,
    });
  };

  const handleReset = () => {
    setDraftGroups([]);
    setDraftLevels([]);
    resetAll();
  };

  const urlSearch = searchParams.get("q") ?? "";

  const hasCommittedFilters =
    urlSearch.length > 0 ||
    selectedGroups.length > 0 ||
    selectedLevels.length > 0;

  const hasActiveFilters =
    hasCommittedFilters || draftGroups.length > 0 || draftLevels.length > 0;

  const hasDraft =
    !haveSameValues(draftGroups, selectedGroups) ||
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
    ...selectedGroups.map((group) => ({
      key: `group-${group}`,
      label: resolveOptionLabel(categoryGroups, group),
      onRemove: () => {
        const next = selectedGroups.filter(
          (selectedGroup) => selectedGroup !== group,
        );
        setDraftGroups(next);
        applyFilter({ groups: next.join(",") || null });
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
    selectedGroups,
    selectedLevels,
    draftGroups,
    draftLevels,
    searchValue,
    activeSearch,
    hasActiveFilters,
    hasCommittedFilters,
    hasDraft,
    activeChips,
    setSearchValue,
    handleGroupToggle,
    handleLevelToggle,
    applyAllDrafts,
    handleReset,
    setPage,
    applyFilter,
  };
}
