export const designerLevelValues = ["free", "pro", "max"] as const;

export type DesignerLevel = (typeof designerLevelValues)[number];

export type DesignerSortValue = "popular" | "newest" | "models";

export const designerSortValues: readonly DesignerSortValue[] = [
  "popular",
  "newest",
  "models",
];

export type Designer = {
  id: string;
  username: string;
  bio: string | null;
  avatar_path: string | null;
  plan_key: DesignerLevel;
  model_count: number;
  created_at: string;
};

export type DesignersResult = {
  designers: Designer[];
  totalCount: number;
};
