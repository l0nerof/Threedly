import { test as base } from "@playwright/test";
import { CatalogPage } from "../pages/catalog.page";
import { HomePage } from "../pages/home.page";
import { PricingPage } from "../pages/pricing.page";

type AppFixtures = {
  catalogPage: CatalogPage;
  homePage: HomePage;
  pricingPage: PricingPage;
};

export const test = base.extend<AppFixtures>({
  catalogPage: async ({ page }, runFixture) => {
    await runFixture(new CatalogPage(page));
  },
  homePage: async ({ page }, runFixture) => {
    await runFixture(new HomePage(page));
  },
  pricingPage: async ({ page }, runFixture) => {
    await runFixture(new PricingPage(page));
  },
});

export { expect } from "@playwright/test";
