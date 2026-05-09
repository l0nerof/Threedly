import { fetchDesignersCount } from "@/src/app/[locale]/(main-pages)/designers/actions";
import { designersQueryKeys } from "@/src/business/queries/designers";
import type { DesignerLevel } from "@/src/business/types/designer";
import { useQuery } from "@tanstack/react-query";

type UseDesignersCountParams = {
  search?: string;
  specializations?: string[];
  levels?: DesignerLevel[];
  enabled: boolean;
};

export function useDesignersCount({
  search,
  specializations,
  levels,
  enabled,
}: UseDesignersCountParams) {
  return useQuery({
    queryKey: designersQueryKeys.count({
      search,
      specializations,
      levels,
    }),
    queryFn: () => fetchDesignersCount({ search, specializations, levels }),
    enabled,
    placeholderData: (prev) => prev,
  });
}
