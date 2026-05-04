import { LocaleCode } from "@/src/business/constants/localization";
import { mapCategoryGroupRowsToOptions } from "@/src/business/utils/categories";
import { describe, expect, it } from "../fixtures";

describe("category utils", () => {
  it("maps category groups with their localized categories", () => {
    const groups = mapCategoryGroupRowsToOptions(
      [
        {
          id: "group-furniture",
          slug: "furniture",
          name_ua: "Меблі",
          name_en: "Furniture",
          sort_order: 10,
          categories: [],
        },
        {
          id: "group-materials",
          slug: "materials",
          name_ua: "Матеріали",
          name_en: "Materials",
          sort_order: 20,
          categories: [
            {
              id: "category-wood",
              slug: "wood",
              name_ua: "Дерево",
              name_en: "Wood",
              sort_order: 10,
              is_featured: true,
            },
          ],
        },
      ],
      LocaleCode.English,
    );

    expect(groups).toEqual([
      {
        id: "group-furniture",
        value: "furniture",
        label: "Furniture",
        categories: [],
      },
      {
        id: "group-materials",
        value: "materials",
        label: "Materials",
        categories: [
          {
            id: "category-wood",
            value: "wood",
            label: "Wood",
            isFeatured: true,
          },
        ],
      },
    ]);
  });
});
