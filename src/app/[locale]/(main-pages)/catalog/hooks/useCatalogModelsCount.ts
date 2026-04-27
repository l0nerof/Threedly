import type {
  CatalogFormatValue,
  CatalogPlanKey,
} from "@/src/business/types/catalog";
import { useQuery } from "@tanstack/react-query";
import { fetchCatalogModelsCount } from "../actions";

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
    queryKey: ["catalog", "count", search, categories, plans, formats],
    queryFn: () =>
      fetchCatalogModelsCount({ search, categories, plans, formats }),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
