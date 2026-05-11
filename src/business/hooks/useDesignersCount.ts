import { fetchDesignersCount } from "@/src/app/[locale]/(main-pages)/designers/actions";
import { designersQueryKeys } from "@/src/business/queries/designers";
import type { DesignerLevel } from "@/src/business/types/designer";
import { useQuery } from "@tanstack/react-query";

type UseDesignersCountParams = {
  search?: string;
  levels?: DesignerLevel[];
  enabled: boolean;
};

export function useDesignersCount({
  search,
  levels,
  enabled,
}: UseDesignersCountParams) {
  return useQuery({
    queryKey: designersQueryKeys.count({
      search,
      levels,
    }),
    queryFn: () => fetchDesignersCount({ search, levels }),
    enabled,
    placeholderData: (prev) => prev,
  });
}
