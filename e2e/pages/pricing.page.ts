import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class PricingPage extends BasePage {
  readonly heading: Locator;
  readonly pricingCards: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: /оберіть/i,
    });
    this.pricingCards = page.locator('[data-slot="card"]');
  }

  async expectLoaded() {
    await this.expectPathname("/ua/pricing");
    await expect(this.heading).toBeVisible();
    await expect(this.pricingCards).toHaveCount(3);
  }
}
