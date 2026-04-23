import {
  catalogFormatValues,
  catalogPlanKeys,
  catalogSortValues,
} from "../constants/catalogConfig";

export type CatalogPlanKey = (typeof catalogPlanKeys)[number];

export type CatalogFormatValue = (typeof catalogFormatValues)[number];

export type CatalogSortValue = (typeof catalogSortValues)[number];

export type CatalogFilterOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
};

export type CatalogModel = {
  id: string;
  slug: string;
  title_ua: string;
  title_en: string;
  cover_image_path: string;
  minimum_plan: CatalogPlanKey;
  file_format: string | null;
  download_count: number;
  is_featured: boolean;
  published_at: string | null;
};

export type CatalogModelsResult = {
  models: CatalogModel[];
  totalCount: number;
};
