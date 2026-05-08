import type {
  DesignerLevel,
  DesignerSortValue,
  DesignerSpecialization,
} from "../types/designer";

type DesignersQueryKeyParams = {
  page: number;
  sort?: DesignerSortValue;
  search?: string;
  specializations?: DesignerSpecialization[];
  levels?: DesignerLevel[];
};

type DesignersCountQueryKeyParams = Omit<DesignersQueryKeyParams, "page">;

export const designersQueryKeys = {
  root: ["designers"] as const,
  list: (params: DesignersQueryKeyParams) =>
    [...designersQueryKeys.root, "list", params] as const,
  count: (params: DesignersCountQueryKeyParams) =>
    [...designersQueryKeys.root, "count", params] as const,
};
