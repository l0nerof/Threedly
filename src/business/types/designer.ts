import { marketplacePlanKeys } from "@/src/business/constants/plans";
import type { Tables } from "@/src/business/types/database.generated";

export const designerLevelValues = marketplacePlanKeys;

export type DesignerLevel = Tables<"profiles">["plan_key"];

export type DesignerSortValue = "popular" | "newest" | "models";

export const designerSortValues: readonly DesignerSortValue[] = [
  "popular",
  "newest",
  "models",
];

export type Designer = Pick<
  Tables<"profiles">,
  "bio" | "created_at" | "id" | "plan_key" | "username"
> & {
  avatar_path: Tables<"profiles">["avatar_path"];
  model_count: number;
};

export type DesignersResult = {
  designers: Designer[];
  totalCount: number;
};

export type DesignerCategoryGroupOption = {
  value: string;
  label: string;
};
