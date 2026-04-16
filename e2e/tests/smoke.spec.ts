import { test } from "../fixtures";

test.describe("smoke", () => {
  test("ua user can open pricing from the home page", async ({
    homePage,
    pricingPage,
  }) => {
    await homePage.open();
    await homePage.expectLoaded();

    await homePage.openPricing();
    await pricingPage.expectLoaded();
  });
});
