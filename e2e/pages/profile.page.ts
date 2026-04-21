import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class ProfileOverviewPage extends BasePage {
  readonly heading: Locator;
  readonly planBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: /кабінет профілю/i,
    });
    this.planBadge = page.getByText(/безкоштовний план/i);
  }

  async open() {
    await this.goto("/ua/profile");
  }

  async expectLoaded() {
    await this.expectPathname("/ua/profile");
    await expect(this.heading).toBeVisible();
    await expect(this.planBadge).toBeVisible();
  }
}

export class ProfileSettingsPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: /налаштування/i,
    });
  }

  async open() {
    await this.goto("/ua/profile/settings");
  }

  async expectLoaded() {
    await this.expectPathname("/ua/profile/settings");
    await expect(this.heading).toBeVisible();
  }
}

export class ProfileLibraryPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: /моя бібліотека/i,
    });
  }

  async open() {
    await this.goto("/ua/profile/library");
  }

  async expectLoaded() {
    await this.expectPathname("/ua/profile/library");
    await expect(this.heading).toBeVisible();
  }
}

export class ProfileUploadsPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { level: 1, name: /мої моделі/i });
  }

  async open() {
    await this.goto("/ua/profile/uploads");
  }

  async expectLoaded() {
    await this.expectPathname("/ua/profile/uploads");
    await expect(this.heading).toBeVisible();
  }
}

export class ProfileSidebarNav {
  readonly overviewLink: Locator;
  readonly libraryLink: Locator;
  readonly uploadsLink: Locator;
  readonly settingsLink: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.overviewLink = page.getByRole("link", { name: /^огляд$/i });
    this.libraryLink = page.getByRole("link", { name: /моя бібліотека/i });
    this.uploadsLink = page.getByRole("link", { name: /мої моделі/i });
    this.settingsLink = page.getByRole("link", { name: /налаштування/i });
    this.signOutButton = page.getByRole("button", { name: /вийти з акаунту/i });
  }
}
