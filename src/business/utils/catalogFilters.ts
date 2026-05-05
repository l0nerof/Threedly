import { type CatalogFilterOption } from "@/src/business/types/catalog";
import type { CategoryGroupOption } from "@/src/business/types/category";

export function resolveOptionLabel(
  options: CatalogFilterOption[],
  value: string,
): string {
  const match = options.find((option) => option.value === value);

  if (match?.label) {
    return match.label;
  }

  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function flattenCategoryGroups(
  groups: CategoryGroupOption[],
): CatalogFilterOption[] {
  return groups.flatMap((group) => group.categories);
}

export function resolveCategoryGroupLabel(
  groups: CategoryGroupOption[],
  value: string,
): string {
  const match = groups.find((group) => group.value === value);

  if (match?.label) {
    return match.label;
  }

  return resolveOptionLabel([], value);
}

export function haveSameValues(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();

  return leftSorted.every((value, index) => value === rightSorted[index]);
}
