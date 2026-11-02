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

  async register(account: {
    username: string;
    email: string;
    password: string;
  }) {
    await this.open();
    await this.usernameInput.fill(account.username);
    await this.emailInput.fill(account.email);
    await this.passwordInput.fill(account.password);
    await this.termsCheckbox.check();
    await this.submitButton.click();
    await this.expectPathname("/ua/verify-email");
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

  async requestReset(email: string) {
    await this.open();
    await this.emailInput.fill(email);
    await this.submitButton.click();
    await expect(
      this.page.getByText(
        "Якщо для цієї адреси існує акаунт, посилання для скидання пароля вже надіслано.",
        { exact: true },
      ),
    ).toBeVisible();
  }
}

export class VerifyEmailPage extends BasePage {
  readonly codeInput: Locator;
  readonly submitButton: Locator;
  readonly resendButton: Locator;
  readonly formAlerts: Locator;

  constructor(page: Page) {
    super(page);
    this.codeInput = page.getByLabel("Одноразовий код", { exact: true });
    this.submitButton = page.getByRole("button", {
      name: "Підтвердити код",
      exact: true,
    });
    this.resendButton = page.getByRole("button", {
      name: /^(Надіслати код ще раз|Повторна відправка через|Надсилаємо)/,
    });
    this.formAlerts = page.locator("form").getByRole("alert");
  }

  async open(email?: string) {
    await this.goto(
      `/ua/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`,
    );
    await expect(this.codeInput).toBeVisible();
  }

  async submitCode(code: string) {
    await this.codeInput.fill("");
    await expect(this.submitButton).toBeDisabled();
    await this.codeInput.fill(code);
    await expect(this.codeInput).toHaveValue(code);
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async expectRejected() {
    await expect(this.formAlerts).toContainText(
      /Код підтвердження недійсний\.|Термін дії коду підтвердження минув\./,
    );
    await expect(this.submitButton).toBeEnabled();
  }
}

export class ResetPasswordPage extends BasePage {
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly formAlerts: Locator;

  constructor(page: Page) {
    super(page);
    this.passwordInput = page.getByLabel("Новий пароль", { exact: true });
    this.confirmPasswordInput = page.getByLabel("Підтвердьте новий пароль", {
      exact: true,
    });
    this.submitButton = page.getByRole("button", {
      name: "Зберегти новий пароль",
      exact: true,
    });
    this.formAlerts = page.locator("form").getByRole("alert");
  }

  async fillAndSubmit(password: string, confirmation = password) {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmation);
    await this.submitButton.click();
  }

  async expectInvalid() {
    await expect(
      this.page.getByText(
        "Посилання для відновлення недійсне або протерміноване.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(this.passwordInput).toHaveCount(0);
    await expect(
      this.page.getByRole("link", {
        name: "Запросити нове посилання",
        exact: true,
      }),
    ).toHaveAttribute("href", "/ua/forgot-password");
  }
}
