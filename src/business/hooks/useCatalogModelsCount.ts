import { fetchCatalogModelsCount } from "@/src/app/[locale]/(main-pages)/catalog/actions";
import { catalogQueryKeys } from "@/src/business/queries/catalog";
import type {
  CatalogFormatValue,
  CatalogPlanKey,
} from "@/src/business/types/catalog";
import { useQuery } from "@tanstack/react-query";

type UseCatalogModelsCountParams = {
  search?: string;
  categories?: string[];
  plans?: CatalogPlanKey[];
  formats?: CatalogFormatValue[];
  enabled: boolean;
};

export function useCatalogModelsCount({
  search,
  categories,
  plans,
  formats,
  enabled,
}: UseCatalogModelsCountParams) {
  return useQuery({
    queryKey: catalogQueryKeys.modelCount({
      search,
      categories,
      plans,
      formats,
    }),
    queryFn: () =>
      fetchCatalogModelsCount({ search, categories, plans, formats }),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
