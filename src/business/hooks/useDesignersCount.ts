import { fetchDesignersCount } from "@/src/app/[locale]/(main-pages)/designers/actions";
import { designersQueryKeys } from "@/src/business/queries/designers";
import type {
  DesignerAccount,
  DesignerLevel,
  DesignerSpecialization,
} from "@/src/business/types/designer";
import { useQuery } from "@tanstack/react-query";

type UseDesignersCountParams = {
  search?: string;
  specializations?: DesignerSpecialization[];
  levels?: DesignerLevel[];
  account?: DesignerAccount[];
  enabled: boolean;
};

export function useDesignersCount({
  search,
  specializations,
  levels,
  account,
  enabled,
}: UseDesignersCountParams) {
  return useQuery({
    queryKey: designersQueryKeys.count({
      search,
      specializations,
      levels,
      account,
    }),
    queryFn: () =>
      fetchDesignersCount({ search, specializations, levels, account }),
    enabled,
    placeholderData: (prev) => prev,
  });
}
