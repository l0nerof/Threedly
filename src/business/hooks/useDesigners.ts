import { fetchDesigners } from "@/src/app/[locale]/(main-pages)/designers/actions";
import { designersQueryKeys } from "@/src/business/queries/designers";
import type {
  DesignerAccount,
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
  account?: DesignerAccount[];
};

export function useDesigners({
  page,
  sort = "popular",
  search,
  specializations,
  levels,
  account,
}: UseDesignersParams) {
  return useQuery({
    queryKey: designersQueryKeys.list({
      page,
      sort,
      search,
      specializations,
      levels,
      account,
    }),
    queryFn: () =>
      fetchDesigners({ page, sort, search, specializations, levels, account }),
    placeholderData: (prev) => prev,
  });
}
