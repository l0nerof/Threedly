import { expect, test } from "../fixtures";

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
    await pricingPage.page.goto("/ua/pricing");
    await expect(pricingPage.page.getByText(/поширені питання/i)).toBeVisible();
    await expect(
      pricingPage.page.getByRole("heading", { name: /часті запитання/i }),
    ).toBeVisible();
  });

  test("root / redirects to /ua", async ({ homePage }) => {
    await homePage.open();
    await homePage.expectLoaded();
  });
});
