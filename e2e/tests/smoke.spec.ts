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

  test("pricing page renders FAQ section", async ({ pricingPage }) => {
    await pricingPage.open();
    await pricingPage.expectLoaded();
    await pricingPage.expectFaqVisible();
  });

  test("root / redirects to /ua", async ({ homePage }) => {
    await homePage.open();
    await homePage.expectLoaded();
  });
});
