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
