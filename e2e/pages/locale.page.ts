import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class EnHomePage extends BasePage {
  readonly heroHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heroHeading = page.getByRole("heading", {
      level: 1,
      name: /3d models/i,
    });
  }

  async open() {
    await this.goto("/en");
  }

  async expectLoaded() {
    await this.expectPathname("/en");
    await expect(this.heroHeading).toBeVisible();
  }
}

export class EnPricingPage extends BasePage {
  readonly heading: Locator;
  readonly pricingCards: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: /working pace/i,
    });
    this.pricingCards = page.locator('[data-slot="card"]');
  }

  async open() {
    await this.goto("/en/pricing");
  }

  async expectLoaded() {
    await this.expectPathname("/en/pricing");
    await expect(this.heading).toBeVisible();
    await expect(this.pricingCards).toHaveCount(3);
  }
}

export class EnLoginPage extends BasePage {
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('[data-slot="card-title"]', {
      hasText: /welcome back/i,
    });
    this.submitButton = page.getByRole("button", { name: /log in/i });
  }

  async open() {
    await this.goto("/en/login");
  }

  async expectLoaded() {
    await this.expectPathname("/en/login");
    await expect(this.heading).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
