import { type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class NotFoundPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(pathname = "/ua/this-route-does-not-exist") {
    await this.goto(pathname);
  }

  async expectLoaded() {
    await expect(this.page.getByRole("main")).toBeVisible();
    await expect(
      this.page.getByRole("link", { name: /повернутися|back.to.home/i }),
    ).toBeVisible();
  }
}
