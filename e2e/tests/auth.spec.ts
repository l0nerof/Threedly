import { expect, test } from "../fixtures";

test.describe("login page", () => {
  test("renders the form", async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.expectLoaded();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.signupLink).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.submitEmpty();
    await expect(loginPage.formAlerts).toHaveCount(2);
  });

  test("shows error for invalid email format", async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.emailInput.fill("not-an-email");
    await loginPage.emailInput.blur();
    await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(loginPage.formAlerts).toHaveCount(1);
  });

  test("shows server error for wrong credentials", async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.fillAndSubmit("wrong@example.com", "wrongpassword123");
    await expect(loginPage.formAlerts).toBeVisible({
      timeout: 20_000,
    });
  });

  test("toggles password visibility", async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.passwordInput.fill("secret123");
    await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
    await loginPage.togglePasswordButton.click();
    await expect(loginPage.passwordInput).toHaveAttribute("type", "text");
    await loginPage.page
      .getByRole("button", { name: /приховати пароль/i })
      .click();
    await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
  });

  test("navigates to signup page", async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.signupLink.click();
    await loginPage.page.waitForURL("**/ua/signup", { timeout: 15_000 });
  });

  test("navigates to forgot-password page", async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.forgotPasswordLink.click();
    await loginPage.page.waitForURL("**/ua/forgot-password", {
      timeout: 15_000,
    });
  });
});

test.describe("signup page", () => {
  test("renders the form", async ({ signupPage }) => {
    await signupPage.open();
    await signupPage.expectLoaded();
    await expect(signupPage.usernameInput).toBeVisible();
    await expect(signupPage.emailInput).toBeVisible();
    await expect(signupPage.passwordInput).toBeVisible();
    await expect(signupPage.termsCheckbox).toBeVisible();
    await expect(signupPage.loginLink).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ signupPage }) => {
    await signupPage.open();
    await signupPage.submitEmpty();
    await expect(signupPage.formAlerts).toHaveCount(4);
  });

  test("shows error for invalid username format", async ({ signupPage }) => {
    await signupPage.open();
    await signupPage.usernameInput.fill("AB");
    await signupPage.usernameInput.blur();
    await expect(signupPage.usernameInput).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(signupPage.formAlerts).toHaveCount(1);
  });

  test("shows error for invalid email format", async ({ signupPage }) => {
    await signupPage.open();
    await signupPage.emailInput.fill("bad-email");
    await signupPage.emailInput.blur();
    await expect(signupPage.emailInput).toHaveAttribute("aria-invalid", "true");
    await expect(signupPage.formAlerts).toHaveCount(1);
  });

  test("navigates to login page", async ({ signupPage }) => {
    await signupPage.open();
    await signupPage.loginLink.click();
    await signupPage.page.waitForURL("**/ua/login", { timeout: 15_000 });
  });
});

test.describe("forgot-password page", () => {
  test("renders the form", async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.expectLoaded();
    await expect(forgotPasswordPage.emailInput).toBeVisible();
    await expect(forgotPasswordPage.backToLoginLink).toBeVisible();
  });

  test("shows error on empty submit", async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.submitButton.click();
    await expect(forgotPasswordPage.formAlerts).toHaveCount(1);
  });

  test("shows error for invalid email format", async ({
    forgotPasswordPage,
  }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.emailInput.fill("not-valid");
    await forgotPasswordPage.emailInput.blur();
    await expect(forgotPasswordPage.emailInput).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(forgotPasswordPage.formAlerts).toHaveCount(1);
  });

  test("shows success message for valid email", async ({
    forgotPasswordPage,
  }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.emailInput.fill("any@example.com");
    await forgotPasswordPage.submitButton.click();
    await expect(forgotPasswordPage.emailInput).toHaveValue("", {
      timeout: 20_000,
    });
  });

  test("navigates back to login", async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.open();
    await forgotPasswordPage.backToLoginLink.click();
    await forgotPasswordPage.page.waitForURL("**/ua/login", {
      timeout: 15_000,
    });
  });
});
