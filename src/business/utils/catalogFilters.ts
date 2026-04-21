import { type CatalogFilterOption } from "@/src/business/types/catalog";

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

export function haveSameValues(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();

  return leftSorted.every((value, index) => value === rightSorted[index]);
}
