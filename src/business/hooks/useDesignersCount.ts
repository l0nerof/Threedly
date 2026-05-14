import { fetchDesignersCount } from "@/src/app/[locale]/(main-pages)/designers/actions";
import { designersQueryKeys } from "@/src/business/queries/designers";
import type { DesignerLevel } from "@/src/business/types/designer";
import { useQuery } from "@tanstack/react-query";

type UseDesignersCountParams = {
  groups?: string[];
  search?: string;
  levels?: DesignerLevel[];
  enabled: boolean;
};

export function useDesignersCount({
  groups,
  search,
  levels,
  enabled,
}: UseDesignersCountParams) {
  return useQuery({
    queryKey: designersQueryKeys.count({
      groups,
      search,
      levels,
    }),
    queryFn: () => fetchDesignersCount({ groups, search, levels }),
    enabled,
    placeholderData: (prev) => prev,
  });
}
