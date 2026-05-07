export const designerSpecializationValues = [
  "furniture",
  "decor",
  "materials",
  "lighting",
  "kitchen",
  "bathroom",
  "exterior",
  "plants",
  "technology",
] as const;

export const designerLevelValues = ["free", "pro", "max"] as const;

export type DesignerSpecialization =
  (typeof designerSpecializationValues)[number];

export type DesignerLevel = (typeof designerLevelValues)[number];

export type DesignerSortValue = "popular" | "newest" | "models";

export const designerSortValues: readonly DesignerSortValue[] = [
  "popular",
  "newest",
  "models",
];

export const designerAccountValues = ["verified", "pro"] as const;

export type DesignerAccount = (typeof designerAccountValues)[number];

export type Designer = {
  id: string;
  username: string;
  bio: string | null;
  avatar_path: string | null;
  plan_key: DesignerLevel;
  is_verified: boolean;
  specializations: DesignerSpecialization[];
  model_count: number;
  created_at: string;
};

export type DesignersResult = {
  designers: Designer[];
  totalCount: number;
};
