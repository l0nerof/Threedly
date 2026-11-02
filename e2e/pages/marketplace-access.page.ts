import { type Page, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { AccessModel } from "../fixtures/local-marketplace";
import { publicationFixture } from "../fixtures/model-publication";
import { LoginPage } from "./auth.page";
import { BasePage } from "./base.page";

export class MarketplaceAccessPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async login(account: { email: string; password: string }) {
    await this.page.context().clearCookies();
    const login = new LoginPage(this.page);
    await login.open();
    await login.fillAndSubmit(account.email, account.password);
    await expect(this.page).toHaveURL(/\/ua\/?$/);
  }

  async openModel(model: AccessModel) {
    await this.goto(`/ua/catalog/${model.slug}`);
    await expect(
      this.page.getByRole("heading", {
        level: 1,
        name: model.title_ua,
        exact: true,
      }),
    ).toBeVisible();
  }

  async expectDownloadDenied(message: string) {
    const downloads: string[] = [];
    const onDownload = () => downloads.push("unexpected download");
    this.page.on("download", onDownload);
    try {
      const button = this.page
        .getByRole("button", { name: "Завантажити", exact: true })
        .first();
      await button.click();
      await expect(this.page.getByText(message, { exact: true })).toBeVisible();
      await expect(button).toBeEnabled();
      expect(downloads).toHaveLength(0);
    } finally {
      this.page.off("download", onDownload);
    }
  }

  async download() {
    const downloaded = this.page.waitForEvent("download");
    const button = this.page
      .getByRole("button", { name: "Завантажити", exact: true })
      .first();
    await button.click();
    const file = await downloaded;
    expect(file.suggestedFilename()).toBe(publicationFixture.source.name);
    const path = await file.path();
    if (!path) throw new Error("Downloaded bytes were not retained");
    expect(await readFile(path)).toEqual(publicationFixture.source.buffer);
    await expect(button).toBeEnabled();
  }

  async expectQuota(used: number, remaining: number) {
    await this.goto("/ua/profile");
    await expect(
      this.page
        .getByRole("group", { name: "Завантаження за місяць", exact: true })
        .locator('[data-slot="card-title"]'),
    ).toHaveText(String(used));
    await expect(
      this.page
        .getByRole("group", { name: "Залишилось завантажень", exact: true })
        .locator('[data-slot="card-title"]'),
    ).toHaveText(String(remaining));
  }

  async deleteDraftAfterRevocation(path: string) {
    await this.goto(path);
    await this.page
      .getByRole("button", { name: "Видалити чернетку", exact: true })
      .click();
    await this.page
      .getByRole("alertdialog", { name: "Видалити цю чернетку?" })
      .getByRole("button", { name: "Продовжити", exact: true })
      .click();
    await expect(this.page).toHaveURL(/\/ua\/profile\/uploads$/);
    await expect(
      this.page.getByRole("heading", {
        level: 1,
        name: "Мої моделі",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("link", { name: "Створити модель" }),
    ).toHaveCount(0);
    await expect(this.page.locator(`a[href="${path}"]`)).toHaveCount(0);
  }
}
