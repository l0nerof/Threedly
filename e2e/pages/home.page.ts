import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class HomePage extends BasePage {
  readonly heroHeading: Locator;
  readonly pricingLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heroHeading = page.getByRole("heading", {
      level: 1,
      name: /3d-моделі/i,
    });
    this.pricingLink = page.getByRole("link", { name: /^ціни$/i }).first();
  }

  async open() {
    await this.goto("/");
  }

  async expectLoaded() {
    await this.expectPathname("/ua");
    await expect(this.heroHeading).toBeVisible();
  }

  async openPricing() {
    await this.pricingLink.click();
  }
}
