import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class CatalogPage extends BasePage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly mobileFiltersButton: Locator;
  readonly filtersPanel: Locator;
  readonly activeFilters: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: /3D-моделі|3D models/i,
    });
    this.searchInput = page.getByRole("textbox", {
      name: /Пошук у каталозі|Search catalog/i,
    });
    this.mobileFiltersButton = page.getByRole("button", {
      name: /^Фільтри$|^Filters$/i,
    });
    this.filtersPanel = page.getByLabel(/Фільтри|Filters/i);
    this.activeFilters = page.getByLabel(/Активні фільтри|Active filters/i);
  }

  async open(pathname = "/ua/catalog") {
    await this.goto(pathname);
  }

  async expectLoaded() {
    await this.expectPathname("/ua/catalog");
    await expect(this.heading).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  async expectDesktopSidebarVisible() {
    await expect(this.filtersPanel.first()).toBeVisible();
  }

  async openMobileFilters() {
    await this.mobileFiltersButton.click();
  }

  async expectMobileFiltersOpen() {
    const dialog = this.page.getByRole("dialog");

    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: /Фільтри|Filters/i }).first(),
    ).toBeVisible();
  }

  async expectActiveCategoryChip(label: string | RegExp) {
    const chipName = typeof label === "string" ? new RegExp(label, "i") : label;

    await expect(
      this.activeFilters.getByRole("button", { name: chipName }),
    ).toBeVisible();
  }
}
