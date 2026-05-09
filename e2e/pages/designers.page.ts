import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class DesignersPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { level: 1, name: /дизайнер/i });
  }

  async open() {
    await this.goto("/ua/designers");
  }

  async expectLoaded() {
    await this.expectPathname("/ua/designers");
    await expect(this.heading).toBeAttached();
  }
}

export class DesignerProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(username: string) {
    await this.goto(`/ua/designers/${username}`);
  }

  async expectLoaded(username: string) {
    await this.expectPathname(`/ua/designers/${username}`);
    await expect(
      this.page.getByRole("heading", {
        level: 1,
        name: new RegExp(username, "i"),
      }),
    ).toBeVisible();
  }
}
