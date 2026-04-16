import { type Page, expect } from "@playwright/test";

export class BasePage {
  constructor(protected readonly page: Page) {}

  protected async goto(pathname: string) {
    await this.page.goto(pathname);
  }

  protected async expectPathname(pathname: string) {
    await expect.poll(() => new URL(this.page.url()).pathname).toBe(pathname);
  }
}
