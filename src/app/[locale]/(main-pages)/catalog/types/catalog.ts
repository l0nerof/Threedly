import {
  catalogFormatValues,
  catalogPlanKeys,
  catalogSortValues,
} from "../constants/catalogConfig";

export type CatalogPlanKey = (typeof catalogPlanKeys)[number];

export type CatalogFormatValue = (typeof catalogFormatValues)[number];

export type CatalogSortValue = (typeof catalogSortValues)[number];

export type CatalogFilterOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
};

export type CatalogSortOption = {
  value: CatalogSortValue;
  label: string;
  description: string;
};

export type CatalogSectionCopy = {
  title: string;
  description?: string;
};

export type CatalogResultsAreaCopy = {
  ariaLabel: string;
  title: string;
  description: string;
  paginationLabel: string;
};

export type CatalogShellContent = {
  badge: string;
  title: string;
  subtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  mobileFiltersButton: string;
  sortLabel: string;
  resetFilters: string;
  activeFiltersLabel: string;
  noActiveFilters: string;
  removeFilter: string;
  filtersPanel: CatalogSectionCopy;
  filters: {
    category: CatalogSectionCopy & {
      empty: string;
    };
    plan: CatalogSectionCopy;
    format: CatalogSectionCopy;
  };
  resultsArea: CatalogResultsAreaCopy;
};
