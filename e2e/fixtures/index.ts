import { test as base } from "@playwright/test";
import { HomePage } from "../pages/home.page";
import { PricingPage } from "../pages/pricing.page";

type AppFixtures = {
  homePage: HomePage;
  pricingPage: PricingPage;
};

export const test = base.extend<AppFixtures>({
  homePage: async ({ page }, runFixture) => {
    await runFixture(new HomePage(page));
  },
  pricingPage: async ({ page }, runFixture) => {
    await runFixture(new PricingPage(page));
  },
});

export { expect } from "@playwright/test";
