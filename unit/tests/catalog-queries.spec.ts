import { catalogQueryKeys } from "@/src/business/queries/catalog";
import { describe, expect, it } from "../fixtures";

describe("catalog queries", () => {
  it("uses a shared prefix for invalidating all catalog model pages", () => {
    expect(catalogQueryKeys.models()).toEqual(["catalog", "models"]);
  });

  it("builds the paginated catalog models query key from the shared prefix", () => {
    expect(
      catalogQueryKeys.modelList({
        page: 2,
        sort: "fresh",
        search: "chair",
        categories: ["chairs"],
        plans: ["pro"],
        formats: ["glb"],
      }),
    ).toEqual([
      "catalog",
      "models",
      {
        categories: ["chairs"],
        formats: ["glb"],
        page: 2,
        plans: ["pro"],
        search: "chair",
        sort: "fresh",
      },
    ]);
  });

  it("builds the filtered catalog count query key from the shared prefix", () => {
    expect(catalogQueryKeys.modelCount({ categories: ["lighting"] })).toEqual([
      "catalog",
      "models",
      "count",
      {
        categories: ["lighting"],
        formats: undefined,
        plans: undefined,
        search: undefined,
      },
    ]);
  });
});
