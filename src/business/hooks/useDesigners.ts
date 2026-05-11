import { fetchDesigners } from "@/src/app/[locale]/(main-pages)/designers/actions";
import { designersQueryKeys } from "@/src/business/queries/designers";
import type {
  DesignerLevel,
  DesignerSortValue,
} from "@/src/business/types/designer";
import { useQuery } from "@tanstack/react-query";

type UseDesignersParams = {
  page: number;
  sort?: DesignerSortValue;
  search?: string;
  levels?: DesignerLevel[];
};

export function useDesigners({
  page,
  sort = "popular",
  search,
  levels,
}: UseDesignersParams) {
  return useQuery({
    queryKey: designersQueryKeys.list({
      page,
      sort,
      search,
      levels,
    }),
    queryFn: () => fetchDesigners({ page, sort, search, levels }),
    placeholderData: (prev) => prev,
  });
}
