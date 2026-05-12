import {
  catalogFormatValues,
  catalogSortValues,
} from "../constants/catalogConfig";
import type { Tables } from "./database.generated";

export type CatalogPlanKey = Tables<"models">["minimum_plan"];

export type CatalogFormatValue = (typeof catalogFormatValues)[number];

export type CatalogSortValue = (typeof catalogSortValues)[number];

export type CatalogFilterOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
};

export type CatalogFilterSection = "category" | "plan" | "format";

export type CatalogModel = Pick<
  Tables<"models">,
  | "cover_image_path"
  | "description_en"
  | "description_ua"
  | "download_count"
  | "file_format"
  | "id"
  | "is_featured"
  | "minimum_plan"
  | "published_at"
  | "slug"
  | "title_en"
  | "title_ua"
>;

export type CatalogModelsResult = {
  models: CatalogModel[];
  totalCount: number;
};
