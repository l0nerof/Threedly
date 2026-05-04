import { fetchCatalogModels } from "@/src/app/[locale]/(main-pages)/catalog/actions";
import { catalogSortValues } from "@/src/business/constants/catalogConfig";
import { catalogQueryKeys } from "@/src/business/queries/catalog";
import type {
  CatalogFormatValue,
  CatalogPlanKey,
  CatalogSortValue,
} from "@/src/business/types/catalog";
import { useQuery } from "@tanstack/react-query";

type UseCatalogModelsParams = {
  page: number;
  sort?: CatalogSortValue;
  search?: string;
  groups?: string[];
  categories?: string[];
  plans?: CatalogPlanKey[];
  formats?: CatalogFormatValue[];
};

export function useCatalogModels({
  page,
  sort = catalogSortValues[0],
  search,
  groups,
  categories,
  plans,
  formats,
}: UseCatalogModelsParams) {
  return useQuery({
    queryKey: catalogQueryKeys.modelList({
      page,
      sort,
      search,
      groups,
      categories,
      plans,
      formats,
    }),
    queryFn: () =>
      fetchCatalogModels({
        page,
        sort,
        search,
        groups,
        categories,
        plans,
        formats,
      }),
    placeholderData: (previousData) => previousData,
  });
}
