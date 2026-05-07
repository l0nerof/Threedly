"use client";

import {
  type DesignerAccount,
  type DesignerLevel,
  type DesignerSortValue,
  type DesignerSpecialization,
  designerAccountValues,
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

const ACCOUNT_CHIP_LABELS: Record<DesignerAccount, string> = {
  verified: "Verified",
  pro: "Pro members",
};

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
  selectedAccount: DesignerAccount[];
  draftSpecializations: DesignerSpecialization[];
  draftLevels: DesignerLevel[];
  draftAccount: DesignerAccount[];
  searchValue: string;
  activeSearch: string | undefined;
  hasActiveFilters: boolean;
  hasCommittedFilters: boolean;
  hasDraft: boolean;
  activeChips: ActiveChip[];
  setSearchValue: (v: string) => void;
  handleSpecializationToggle: (v: DesignerSpecialization) => void;
  handleLevelToggle: (v: DesignerLevel) => void;
  handleAccountToggle: (v: DesignerAccount) => void;
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
  const accountParam = searchParams.get("account") ?? "";

  const selectedSpecializations = parseListParam(
    specializationsParam,
    designerSpecializationValues,
  );
  const selectedLevels = parseListParam(levelsParam, designerLevelValues);
  const selectedAccount = parseListParam(accountParam, designerAccountValues);

  const [draftSpecializations, setDraftSpecializations] = useState<
    DesignerSpecialization[]
  >(selectedSpecializations);
  const [draftLevels, setDraftLevels] =
    useState<DesignerLevel[]>(selectedLevels);
  const [draftAccount, setDraftAccount] =
    useState<DesignerAccount[]>(selectedAccount);

  useEffect(() => {
    setDraftSpecializations(
      parseListParam(specializationsParam, designerSpecializationValues),
    );
  }, [specializationsParam]);

  useEffect(() => {
    setDraftLevels(parseListParam(levelsParam, designerLevelValues));
  }, [levelsParam]);

  useEffect(() => {
    setDraftAccount(parseListParam(accountParam, designerAccountValues));
  }, [accountParam]);

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

  const handleAccountToggle = (value: DesignerAccount) => {
    setDraftAccount((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
    );
  };

  const applyAllDrafts = () => {
    applyFilter({
      specializations:
        draftSpecializations.length > 0 ? draftSpecializations.join(",") : null,
      levels: draftLevels.length > 0 ? draftLevels.join(",") : null,
      account: draftAccount.length > 0 ? draftAccount.join(",") : null,
    });
  };

  const handleReset = () => {
    setDraftSpecializations([]);
    setDraftLevels([]);
    setDraftAccount([]);
    resetAll();
  };

  const urlSearch = searchParams.get("q") ?? "";

  const hasCommittedFilters =
    urlSearch.length > 0 ||
    selectedSpecializations.length > 0 ||
    selectedLevels.length > 0 ||
    selectedAccount.length > 0;

  const hasActiveFilters =
    hasCommittedFilters ||
    draftSpecializations.length > 0 ||
    draftLevels.length > 0 ||
    draftAccount.length > 0;

  const hasDraft =
    !haveSameValues(draftSpecializations, selectedSpecializations) ||
    !haveSameValues(draftLevels, selectedLevels) ||
    !haveSameValues(draftAccount, selectedAccount);

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
    ...selectedAccount.map((acc) => ({
      key: `account-${acc}`,
      label: ACCOUNT_CHIP_LABELS[acc],
      onRemove: () => {
        const next = selectedAccount.filter((a) => a !== acc);
        setDraftAccount(next);
        applyFilter({ account: next.join(",") || null });
      },
    })),
  ].filter((chip): chip is ActiveChip => chip !== null);

  return {
    page,
    selectedSort,
    selectedSpecializations,
    selectedLevels,
    selectedAccount,
    draftSpecializations,
    draftLevels,
    draftAccount,
    searchValue,
    activeSearch,
    hasActiveFilters,
    hasCommittedFilters,
    hasDraft,
    activeChips,
    setSearchValue,
    handleSpecializationToggle,
    handleLevelToggle,
    handleAccountToggle,
    applyAllDrafts,
    handleReset,
    setPage,
    applyFilter,
  };
}
