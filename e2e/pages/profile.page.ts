import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class ProfileOverviewPage extends BasePage {
  readonly heading: Locator;
  readonly planBadge: Locator;
  readonly cards: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: /кабінет профілю/i,
    });
    this.planBadge = page.getByText("План Pro", { exact: true });
    this.cards = page.getByRole("group", {
      name: /^(Завантаження за місяць|Залишилось завантажень|Опубліковані моделі|Обране)$/,
    });
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
  readonly usernameInput: Locator;
  readonly bioInput: Locator;
  readonly emailInput: Locator;
  readonly saveButton: Locator;
  readonly avatarMenu: Locator;
  readonly avatarImage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: /налаштування/i,
    });
    this.usernameInput = page.getByLabel("Username", { exact: true });
    this.bioInput = page.getByLabel("Про себе", { exact: true });
    this.emailInput = page.getByLabel("Email", { exact: true });
    this.saveButton = page.getByRole("button", {
      name: "Зберегти зміни",
      exact: true,
    });
    this.avatarMenu = page.getByRole("button", {
      name: "Відкрити меню аватара",
      exact: true,
    });
    this.avatarImage = this.avatarMenu.locator("img");
  }

  async open() {
    await this.goto("/ua/profile/settings");
  }

  async expectLoaded() {
    await this.expectPathname("/ua/profile/settings");
    await expect(this.heading).toBeVisible();
  }

  async expectProfile(username: string, bio: string, email: string) {
    await this.expectLoaded();
    await expect(this.usernameInput).toHaveValue(username);
    await expect(this.bioInput).toHaveValue(bio);
    await expect(this.emailInput).toHaveValue(email);
    await expect(this.emailInput).toHaveAttribute("readonly", "");
    await expect(this.saveButton).toBeDisabled();
  }

  async expectSaveResult(ok: boolean) {
    await expect(
      this.page.getByText(
        ok ? "Зміни успішно збережено." : "Не вдалося зберегти зміни.",
        { exact: true },
      ),
    ).toBeVisible();
  }

  async chooseAvatar(file: { name: string; mimeType: string; buffer: Buffer }) {
    await this.avatarMenu.click();
    const upload = this.page.getByRole("menuitem", {
      name: "Завантажити фото...",
      exact: true,
    });
    await expect(upload).toBeEnabled();
    const chooser = this.page.waitForEvent("filechooser");
    await upload.click();
    await (await chooser).setFiles(file);
    await expect(this.page.getByRole("menu")).not.toBeVisible();
  }

  async expectAvatarLoaded(path: string) {
    await expect(this.avatarImage).toHaveCount(1);
    await expect(this.avatarImage).toHaveAttribute(
      "src",
      new RegExp(encodeURIComponent(`/avatars/${path}`)),
    );
    await expect
      .poll(() =>
        this.avatarImage.evaluate(
          (image: HTMLImageElement) => image.naturalWidth,
        ),
      )
      .toBeGreaterThan(0);
  }

  async removeAvatar() {
    await this.avatarMenu.click();
    await this.page
      .getByRole("menuitem", { name: "Прибрати фото", exact: true })
      .click();
    await this.expectSaveResult(true);
    await expect(this.avatarImage).toHaveCount(0);
  }
}

export class ProfileLibraryPage extends BasePage {
  readonly heading: Locator;
  readonly tabs: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      level: 1,
      name: /моя бібліотека/i,
    });
    this.tabs = page.getByRole("tablist", { name: "Моя бібліотека" });
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
  readonly createModelLink: Locator;
  readonly draftsHeading: Locator;
  readonly uploadedModelsHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { level: 1, name: /мої моделі/i });
    this.createModelLink = page.getByRole("link", { name: "Створити модель" });
    this.draftsHeading = page.getByRole("heading", {
      name: "Чернетки",
      exact: true,
    });
    this.uploadedModelsHeading = page.getByRole("heading", {
      name: "Завантажені моделі",
    });
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
