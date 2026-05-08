import { fetchDesigners } from "@/src/app/[locale]/(main-pages)/designers/actions";
import { designersQueryKeys } from "@/src/business/queries/designers";
import type {
  DesignerLevel,
  DesignerSortValue,
  DesignerSpecialization,
} from "@/src/business/types/designer";
import { useQuery } from "@tanstack/react-query";

type UseDesignersParams = {
  page: number;
  sort?: DesignerSortValue;
  search?: string;
  specializations?: DesignerSpecialization[];
  levels?: DesignerLevel[];
};

export function useDesigners({
  page,
  sort = "popular",
  search,
  specializations,
  levels,
}: UseDesignersParams) {
  return useQuery({
    queryKey: designersQueryKeys.list({
      page,
      sort,
      search,
      specializations,
      levels,
    }),
    queryFn: () =>
      fetchDesigners({ page, sort, search, specializations, levels }),
    placeholderData: (prev) => prev,
  });
}
