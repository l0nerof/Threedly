import { LocaleCode } from "@/src/business/constants/localization";
import type {
  CategoryGroupOption,
  CategoryGroupRow,
  CategoryOption,
  CategoryRow,
} from "@/src/business/types/category";

function localizedName(
  row: Pick<CategoryGroupRow | CategoryRow, "name_en" | "name_ua">,
  locale: LocaleCode,
): string {
  return locale === LocaleCode.Ukrainian ? row.name_ua : row.name_en;
}

function compareByOrderThenLabel(
  left: { label: string; sortOrder: number },
  right: { label: string; sortOrder: number },
): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return left.label.localeCompare(right.label);
}

export function mapCategoryRowToOption(
  row: CategoryRow,
  locale: LocaleCode,
): CategoryOption & { sortOrder: number } {
  return {
    id: row.id,
    value: row.slug,
    label: localizedName(row, locale),
    isFeatured: Boolean(row.is_featured),
    sortOrder: row.sort_order ?? 0,
  };
}

export function mapCategoryGroupRowsToOptions(
  rows: CategoryGroupRow[],
  locale: LocaleCode,
): CategoryGroupOption[] {
  return rows
    .map((group) => {
      const categories = (group.categories ?? [])
        .map((category) => mapCategoryRowToOption(category, locale))
        .sort(compareByOrderThenLabel)
        .map((category) => ({
          id: category.id,
          value: category.value,
          label: category.label,
          isFeatured: category.isFeatured,
        }));

      return {
        id: group.id,
        value: group.slug,
        label: localizedName(group, locale),
        categories,
        sortOrder: group.sort_order ?? 0,
      };
    })
    .sort(compareByOrderThenLabel)
    .map((group) => ({
      id: group.id,
      value: group.value,
      label: group.label,
      categories: group.categories,
    }));
}
