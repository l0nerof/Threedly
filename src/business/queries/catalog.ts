import { catalogSortValues } from "@/src/business/constants/catalogConfig";
import type {
  CatalogFormatValue,
  CatalogPlanKey,
  CatalogSortValue,
} from "@/src/business/types/catalog";

type CatalogModelListQueryKeyParams = {
  page: number;
  sort?: CatalogSortValue;
  search?: string;
  groups?: string[];
  categories?: string[];
  plans?: CatalogPlanKey[];
  formats?: CatalogFormatValue[];
};

type CatalogModelCountQueryKeyParams = {
  search?: string;
  groups?: string[];
  categories?: string[];
  plans?: CatalogPlanKey[];
  formats?: CatalogFormatValue[];
};

export const catalogQueryKeys = {
  root: ["catalog"] as const,
  models: () => [...catalogQueryKeys.root, "models"] as const,
  modelList: ({
    page,
    sort = catalogSortValues[0],
    search,
    groups,
    categories,
    plans,
    formats,
  }: CatalogModelListQueryKeyParams) =>
    [
      ...catalogQueryKeys.models(),
      { categories, formats, groups, page, plans, search, sort },
    ] as const,
  modelCount: ({
    search,
    groups,
    categories,
    plans,
    formats,
  }: CatalogModelCountQueryKeyParams) =>
    [
      ...catalogQueryKeys.models(),
      "count",
      { categories, formats, groups, plans, search },
    ] as const,
};
