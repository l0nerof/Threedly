import { expect, test } from "../fixtures";
import type { LocalEmailAuth } from "../fixtures/local-email-auth";
import { localMutationTestsEnabled } from "../fixtures/model-publication";
import {
  LoginPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "../pages/auth.page";

async function confirmation(fixture: LocalEmailAuth, excluded: string[] = []) {
  await expect
    .poll(async () => Boolean(await fixture.confirmation(excluded)), {
      timeout: 15_000,
    })
    .toBe(true);
  const mail = await fixture.confirmation(excluded);
  if (!mail) throw new Error("Confirmation mail disappeared");
  return mail;
}

async function recovery(fixture: LocalEmailAuth) {
  await expect
    .poll(async () => Boolean(await fixture.recovery()), { timeout: 15_000 })
    .toBe(true);
  const mail = await fixture.recovery();
  if (!mail) throw new Error("Recovery mail disappeared");
  return mail;
}

test.describe("email auth — real local mail", () => {
  test.skip(
    !localMutationTestsEnabled,
    "Enable only with the local Supabase stack",
  );
  test.setTimeout(120_000);

  test("signup requires the emailed code, rejects a wrong code and creates a Free profile", async ({
    localEmailAuth: fixture,
    signupPage,
    verifyEmailPage: verify,
    page,
    browser,
  }, testInfo) => {
    await signupPage.register(fixture.account);
    expect(await fixture.accountState()).toEqual({
      confirmed: false,
      username: fixture.account.username,
      plan_key: "free",
      downloads_limit_monthly: 5,
      can_upload: false,
    });
    const guest = await browser.newPage();
    try {
      const login = new LoginPage(guest);
      await login.open();
      await login.fillAndSubmit(
        fixture.account.email,
        fixture.account.password,
      );
      await expect(login.formAlerts).toContainText(
        "Підтвердіть email перед входом.",
      );
      await guest.goto("/ua/profile");
      await expect(guest).toHaveURL(/\/ua\/login$/);
    } finally {
      await guest.close();
    }
    const mail = await confirmation(fixture);
    const wrongCode = `${mail.code.slice(0, 5)}${(Number(mail.code[5]) + 1) % 10}`;
    await verify.submitCode(wrongCode);
    await verify.expectRejected();
    expect((await fixture.accountState())?.confirmed).toBe(false);
    await page.screenshot({
      path: testInfo.outputPath("wrong-otp.png"),
      animations: "disabled",
    });
    await verify.submitCode(mail.code);
    await expect(page).toHaveURL(/\/ua\/?$/);
    expect((await fixture.accountState())?.confirmed).toBe(true);
    await page.goto("/ua/profile");
    await expect(page.getByText("План Free", { exact: true })).toBeVisible();
    await expect(
      page
        .getByRole("group", { name: "Залишилось завантажень", exact: true })
        .locator('[data-slot="card-title"]'),
    ).toHaveText("5");
  });

  test("a used signup code cannot establish another session", async ({
    localEmailAuth: fixture,
    signupPage,
    verifyEmailPage: verify,
    page,
    browser,
  }) => {
    await signupPage.register(fixture.account);
    const mail = await confirmation(fixture);
    await verify.submitCode(mail.code);
    await expect(page).toHaveURL(/\/ua\/?$/);
    const guest = await browser.newPage();
    try {
      const second = new VerifyEmailPage(guest);
      await second.open(fixture.account.email);
      await second.submitCode(mail.code);
      await second.expectRejected();
      await guest.goto("/ua/profile");
      await expect(guest).toHaveURL(/\/ua\/login$/);
    } finally {
      await guest.close();
    }
  });

  test("resend waits for the real cooldown and delivers a new working code", async ({
    localEmailAuth: fixture,
    signupPage,
    verifyEmailPage: verify,
    page,
  }, testInfo) => {
    await signupPage.register(fixture.account);
    const first = await confirmation(fixture);
    await expect(verify.resendButton).toBeDisabled();
    await expect(verify.resendButton).toHaveText("Надіслати код ще раз", {
      timeout: 65_000,
    });
    await page.screenshot({
      path: testInfo.outputPath("resend-ready.png"),
      animations: "disabled",
    });
    await verify.resendButton.click();
    await expect(
      page.getByText("Новий код надіслано на вашу пошту.", { exact: true }),
    ).toBeVisible();
    const next = await confirmation(fixture, [first.id]);
    expect(next.id).not.toBe(first.id);
    await expect(verify.resendButton).toBeDisabled();
    await verify.submitCode(next.code);
    await expect(page).toHaveURL(/\/ua\/?$/);
    expect((await fixture.accountState())?.confirmed).toBe(true);
  });

  test("verification without an email cannot submit or resend", async ({
    verifyEmailPage: verify,
  }) => {
    await verify.open();
    await verify.codeInput.fill("123456");
    await expect(verify.submitButton).toBeDisabled();
    await expect(verify.resendButton).toBeDisabled();
  });

  test("direct password reset without a recovery session is rejected", async ({
    resetPasswordPage: reset,
    page,
  }) => {
    await page.goto("/ua/reset-password");
    await reset.expectInvalid();
  });

  test("recovery mail changes the password, validates input and rejects the old password and reused link", async ({
    localEmailAuth: fixture,
    forgotPasswordPage,
    resetPasswordPage: reset,
    loginPage,
    page,
    browser,
  }, testInfo) => {
    await fixture.createConfirmedAccount();
    await forgotPasswordPage.requestReset(fixture.account.email);
    const mail = await recovery(fixture);
    await page.goto(mail.url);
    await expect(reset.passwordInput).toBeVisible();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/ua/reset-password");
    await reset.submitButton.click();
    await expect(reset.formAlerts).toContainText([
      "Пароль має містити щонайменше 8 символів.",
      "Потрібно підтвердити пароль.",
    ]);
    await reset.fillAndSubmit(
      fixture.account.nextPassword,
      "DifferentPassword123!",
    );
    await expect(reset.formAlerts).toContainText(["Паролі не збігаються."]);
    await reset.fillAndSubmit(fixture.account.password);
    await expect(reset.formAlerts).toContainText([
      "Новий пароль має відрізнятися від поточного.",
    ]);
    await reset.fillAndSubmit(fixture.account.nextPassword);
    await expect(page).toHaveURL(/\/ua\/login\?reset=success$/);
    await expect(
      page.getByText("Пароль змінено. Увійдіть, використовуючи новий пароль.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("password-reset.png"),
      animations: "disabled",
    });
    await loginPage.fillAndSubmit(
      fixture.account.email,
      fixture.account.password,
    );
    await expect(loginPage.formAlerts).toContainText(
      "Невірний email або пароль.",
    );
    await loginPage.fillAndSubmit(
      fixture.account.email,
      fixture.account.nextPassword,
    );
    await expect(page).toHaveURL(/\/ua\/?$/);
    await page.goto("/ua/profile");
    await expect(
      page.getByRole("heading", { name: "Кабінет профілю", exact: true }),
    ).toBeVisible();
    const guest = await browser.newPage();
    try {
      await guest.goto(mail.url);
      await new ResetPasswordPage(guest).expectInvalid();
    } finally {
      await guest.close();
    }
  });

  test("English recovery preserves the locale through the email, reset and new login", async ({
    localEmailAuth: fixture,
    page,
  }) => {
    await fixture.createConfirmedAccount();
    await page.goto("/en/forgot-password");
    await page
      .getByLabel("Email address", { exact: true })
      .fill(fixture.account.email);
    await page
      .getByRole("button", { name: "Send reset email", exact: true })
      .click();
    await expect(
      page.getByText(
        "If an account exists for this email address, the password reset link has been sent.",
        { exact: true },
      ),
    ).toBeVisible();
    const mail = await recovery(fixture);
    await page.goto(mail.url);
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe("/en/reset-password");
    await page
      .getByLabel("New password", { exact: true })
      .fill(fixture.account.nextPassword);
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill(fixture.account.nextPassword);
    await page
      .getByRole("button", { name: "Save new password", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/login\?reset=success$/);
    await expect(
      page.getByText("Password updated. Sign in using your new password.", {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByLabel("Email address", { exact: true })
      .fill(fixture.account.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill(fixture.account.nextPassword);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("a corrupted recovery link cannot open the password form or change the password", async ({
    localEmailAuth: fixture,
    forgotPasswordPage,
    resetPasswordPage: reset,
    loginPage,
    page,
  }) => {
    await fixture.createConfirmedAccount();
    await forgotPasswordPage.requestReset(fixture.account.email);
    const mail = await recovery(fixture);
    const corrupted = new URL(mail.url);
    const token = corrupted.searchParams.get("token");
    if (!token) throw new Error("Recovery email token is missing");
    corrupted.searchParams.set(
      "token",
      `${token[0] === "0" ? "1" : "0"}${token.slice(1)}`,
    );
    await page.goto(corrupted.toString());
    await reset.expectInvalid();
    await loginPage.open();
    await loginPage.fillAndSubmit(
      fixture.account.email,
      fixture.account.password,
    );
    await expect(page).toHaveURL(/\/ua\/?$/);
  });
});
