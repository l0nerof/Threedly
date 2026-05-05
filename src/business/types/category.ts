export type Category = {
  slug: string;
  name_ua: string;
  name_en: string;
};

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

export type CategoryRow = {
  id: string;
  slug: string;
  name_ua: string;
  name_en: string;
  sort_order: number | null;
  is_featured: boolean | null;
};

export type CategoryGroupRow = {
  id: string;
  slug: string;
  name_ua: string;
  name_en: string;
  sort_order: number | null;
  categories: CategoryRow[] | null;
};
