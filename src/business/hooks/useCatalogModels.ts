import { fetchCatalogModels } from "@/src/app/[locale]/(main-pages)/catalog/actions";
import { catalogSortValues } from "@/src/business/constants/catalogConfig";
import { catalogQueryKeys } from "@/src/business/queries/catalog";
import type { CatalogSortValue } from "@/src/business/types/catalog";
import { useQuery } from "@tanstack/react-query";

type UseCatalogModelsParams = {
  page: number;
  sort?: CatalogSortValue;
};

export function useCatalogModels({
  page,
  sort = catalogSortValues[0],
}: UseCatalogModelsParams) {
  return useQuery({
    queryKey: catalogQueryKeys.modelList({ page, sort }),
    queryFn: () => fetchCatalogModels({ page, sort }),
    placeholderData: (previousData) => previousData,
  });
}
