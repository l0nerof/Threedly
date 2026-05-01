import { catalogQueryKeys } from "@/src/business/queries/catalog";
import { describe, expect, it } from "../fixtures";

describe("catalog queries", () => {
  it("uses a shared prefix for invalidating all catalog model pages", () => {
    expect(catalogQueryKeys.models()).toEqual(["catalog", "models"]);
  });

  it("builds the paginated catalog models query key from the shared prefix", () => {
    expect(catalogQueryKeys.modelList({ page: 2, sort: "fresh" })).toEqual([
      "catalog",
      "models",
      {
        page: 2,
        sort: "fresh",
      },
    ]);
  });
});
