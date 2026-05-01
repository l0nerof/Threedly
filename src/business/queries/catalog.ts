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
  categories?: string[];
  plans?: CatalogPlanKey[];
  formats?: CatalogFormatValue[];
};

type CatalogModelCountQueryKeyParams = {
  search?: string;
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
    categories,
    plans,
    formats,
  }: CatalogModelListQueryKeyParams) =>
    [
      ...catalogQueryKeys.models(),
      { categories, formats, page, plans, search, sort },
    ] as const,
  modelCount: ({
    search,
    categories,
    plans,
    formats,
  }: CatalogModelCountQueryKeyParams) =>
    [
      ...catalogQueryKeys.models(),
      "count",
      { categories, formats, plans, search },
    ] as const,
};
