import { catalogSortValues } from "@/src/business/constants/catalogConfig";
import type { CatalogSortValue } from "@/src/business/types/catalog";

type CatalogModelListQueryKeyParams = {
  page: number;
  sort?: CatalogSortValue;
};

export const catalogQueryKeys = {
  root: ["catalog"] as const,
  models: () => [...catalogQueryKeys.root, "models"] as const,
  modelList: ({
    page,
    sort = catalogSortValues[0],
  }: CatalogModelListQueryKeyParams) =>
    [...catalogQueryKeys.models(), { page, sort }] as const,
};
