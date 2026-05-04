import {
  flattenCategoryGroups,
  haveSameValues,
  resolveCategoryGroupLabel,
  resolveOptionLabel,
} from "@/src/business/utils/catalogFilters";
import { describe, expect, it } from "../fixtures";

describe("catalog filter utils", () => {
  const categoryGroups = [
    {
      value: "furniture",
      label: "Furniture",
      categories: [
        { id: "category-1", value: "chairs", label: "Chairs" },
        { id: "category-2", value: "sofas", label: "Sofas" },
      ],
    },
    {
      value: "decor",
      label: "Decor",
      categories: [{ id: "category-3", value: "vases", label: "Vases" }],
    },
  ];

  describe("resolveOptionLabel", () => {
    it("returns the matching option label", () => {
      expect(
        resolveOptionLabel(
          [
            { value: "chairs", label: "Chairs" },
            { value: "sofas", label: "Sofas" },
          ],
          "sofas",
        ),
      ).toBe("Sofas");
    });

    it("formats unknown dashed values as readable labels", () => {
      expect(resolveOptionLabel([], "outdoor-lighting")).toBe(
        "Outdoor Lighting",
      );
    });
  });

  describe("grouped category helpers", () => {
    it("flattens category groups into catalog filter options", () => {
      expect(flattenCategoryGroups(categoryGroups)).toEqual([
        { id: "category-1", value: "chairs", label: "Chairs" },
        { id: "category-2", value: "sofas", label: "Sofas" },
        { id: "category-3", value: "vases", label: "Vases" },
      ]);
    });

    it("resolves group labels and formats unknown group slugs", () => {
      expect(resolveCategoryGroupLabel(categoryGroups, "decor")).toBe("Decor");
      expect(resolveCategoryGroupLabel(categoryGroups, "outdoor-assets")).toBe(
        "Outdoor Assets",
      );
    });
  });

  describe("haveSameValues", () => {
    it("matches the same values regardless of order", () => {
      expect(haveSameValues(["pro", "free"], ["free", "pro"])).toBe(true);
    });

    it("returns false for different value sets", () => {
      expect(haveSameValues(["free", "free"], ["free", "pro"])).toBe(false);
    });
  });
});
