import type { Tables } from "@/src/business/types/database.generated";

export type Category = Pick<
  Tables<"categories">,
  "name_en" | "name_ua" | "slug"
>;

export type CategoryOption = {
  id: string;
  value: string;
  label: string;
  isFeatured?: boolean;
};

export type CategoryGroupOption = {
  id?: string;
  value: string;
  label: string;
  categories: CategoryOption[];
};

export type CategoryRow = Pick<
  Tables<"categories">,
  "id" | "is_featured" | "name_en" | "name_ua" | "slug" | "sort_order"
>;

export type CategoryGroupRow = Pick<
  Tables<"category_groups">,
  "id" | "name_en" | "name_ua" | "slug" | "sort_order"
> & {
  categories: CategoryRow[] | null;
};
