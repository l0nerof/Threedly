import {
  haveSameValues,
  resolveOptionLabel,
} from "@/src/business/utils/catalogFilters";
import { describe, expect, it } from "../fixtures";

describe("catalog filter utils", () => {
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

  describe("haveSameValues", () => {
    it("matches the same values regardless of order", () => {
      expect(haveSameValues(["pro", "free"], ["free", "pro"])).toBe(true);
    });

    it("returns false for different value sets", () => {
      expect(haveSameValues(["free", "free"], ["free", "pro"])).toBe(false);
    });
  });
});
