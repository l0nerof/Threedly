import { test } from "../fixtures";

test.describe("catalog", () => {
  test("desktop catalog shell renders the search surface and sidebar", async ({
    page,
    catalogPage,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });

    await catalogPage.open();
    await catalogPage.expectLoaded();
    await catalogPage.expectDesktopSidebarVisible();
  });

  test("mobile catalog shell opens the filters sheet", async ({
    page,
    catalogPage,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await catalogPage.open();
    await catalogPage.expectLoaded();
    await catalogPage.openMobileFilters();
    await catalogPage.expectMobileFiltersOpen();
  });

  test("category query preselects the matching filter chip", async ({
    page,
    catalogPage,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });

    await catalogPage.open("/ua/catalog?category=chairs");
    await catalogPage.expectLoaded();
    await catalogPage.expectActiveCategoryChip(/Стільці|Chairs/i);
  });

  test("group query preselects the matching filter chip", async ({
    page,
    catalogPage,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });

    await catalogPage.open("/ua/catalog?group=furniture");
    await catalogPage.expectLoaded();
    await catalogPage.expectActiveCategoryChip(/Меблі|Furniture/i);
  });
});
