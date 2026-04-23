import {
  CATALOG_PAGE_SIZE,
  catalogSortValues,
} from "@/src/business/constants/catalogConfig";
import type { CatalogSortValue } from "@/src/business/types/catalog";
import { useQuery } from "@tanstack/react-query";
import { fetchCatalogModels } from "../actions";

type UseCatalogModelsParams = {
  page: number;
  sort?: CatalogSortValue;
};

export function useCatalogModels({
  page,
  sort = catalogSortValues[0],
}: UseCatalogModelsParams) {
  return useQuery({
    queryKey: ["catalog", "models", page, sort],
    queryFn: () => fetchCatalogModels({ page, sort }),
    placeholderData: (previousData) => previousData,
  });
}
