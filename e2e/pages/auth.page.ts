import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly togglePasswordButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;
  readonly formAlerts: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('[data-slot="card-title"]', {
      hasText: /з поверненням/i,
    });
    this.emailInput = page.getByLabel(/^(email адреса|email address)$/i);
    this.passwordInput = page.getByLabel(/^(пароль|password)$/i);
    this.submitButton = page.getByRole("button", { name: /увійти/i });
    this.togglePasswordButton = page.getByRole("button", {
      name: /показати пароль/i,
    });
    this.forgotPasswordLink = page.getByRole("link", {
      name: /забули пароль/i,
    });
    this.signupLink = page.getByRole("link", { name: /зареєструватися/i });
    this.formAlerts = page.locator("form").getByRole("alert");
  }

  async open() {
    await this.goto("/ua/login");
  }

  async expectLoaded() {
    await this.expectPathname("/ua/login");
    await expect(this.heading).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async submitEmpty() {
    await this.submitButton.click();
  }

  async fillAndSubmit(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

export class SignupPage extends BasePage {
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly formAlerts: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('[data-slot="card-title"]', {
      hasText: /створити акаунт/i,
    });
    this.usernameInput = page.getByLabel(/username/i);
    this.emailInput = page.getByLabel(/^(email адреса|email address)$/i);
    this.passwordInput = page.getByLabel(/^(пароль|password)$/i);
    this.termsCheckbox = page.getByRole("checkbox");
    this.submitButton = page.getByRole("button", { name: /створити акаунт/i });
    this.loginLink = page.getByRole("link", { name: /увійти/i });
    this.formAlerts = page.locator("form").getByRole("alert");
  }

  async open() {
    await this.goto("/ua/signup");
  }

  async expectLoaded() {
    await this.expectPathname("/ua/signup");
    await expect(this.heading).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async submitEmpty() {
    await this.submitButton.click();
  }
}

export class ForgotPasswordPage extends BasePage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly backToLoginLink: Locator;
  readonly formAlerts: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('[data-slot="card-title"]', {
      hasText: /відновлення пароля/i,
    });
    this.emailInput = page.getByLabel(/^(email адреса|email address)$/i);
    this.submitButton = page.getByRole("button", { name: /надіслати лист/i });
    this.backToLoginLink = page.getByRole("link", {
      name: /повернутися до входу/i,
    });
    this.formAlerts = page.locator("form").getByRole("alert");
  }

  async open() {
    await this.goto("/ua/forgot-password");
  }

  async expectLoaded() {
    await this.expectPathname("/ua/forgot-password");
    await expect(this.heading).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
