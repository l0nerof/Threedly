import { expect, test } from "../fixtures";
import {
  demoCredentials,
  localMutationTestsEnabled,
} from "../fixtures/model-publication";
import { STORAGE_STATE_PATH, isDemoSessionAvailable } from "../global-setup";

test.describe("profile — unauthenticated", () => {
  test("redirects to login when not logged in", async ({ page }) => {
    await page.goto("/ua/profile");
    await expect.poll(() => new URL(page.url()).pathname).toBe("/ua/login");
  });

  test("redirects settings to login when not logged in", async ({ page }) => {
    await page.goto("/ua/profile/settings");
    await expect.poll(() => new URL(page.url()).pathname).toBe("/ua/login");
  });
});

test.describe("profile — local interactions", () => {
  test.skip(
    !localMutationTestsEnabled || !isDemoSessionAvailable(),
    "Local mutation tests require the demo user and explicit opt-in",
  );
  test.use({ storageState: STORAGE_STATE_PATH });

  test.beforeEach(async ({ page, loginPage }) => {
    await page.context().clearCookies();
    await loginPage.open();
    await loginPage.fillAndSubmit(
      demoCredentials.email,
      demoCredentials.password,
    );
    await expect(page).toHaveURL(/\/ua\/?$/);
  });

  test("favorite toggle persists in the library and can be restored", async ({
    page,
  }) => {
    await page.goto("/ua/catalog");
    const card = page.getByRole("article").first();
    const button = card.locator("button[aria-pressed]");
    await expect(button).toBeEnabled();
    await expect(button).toHaveAttribute("aria-pressed", /^(true|false)$/);
    const initial = await button.getAttribute("aria-pressed");
    const title = await card.getByRole("heading").innerText();
    try {
      await button.click();
      await expect(button).toHaveAttribute(
        "aria-pressed",
        String(initial !== "true"),
      );
      await expect(button).toHaveAttribute("aria-busy", "false");
      await page.goto("/ua/profile/library?tab=favoriteModels");
      const favorite = page.getByRole("link", { name: title, exact: true });
      if (initial === "true") await expect(favorite).toHaveCount(0);
      else await expect(favorite).toBeVisible();
    } finally {
      await page.goto("/ua/catalog");
      await expect(button).toBeEnabled();
      await expect(button).toHaveAttribute("aria-pressed", /^(true|false)$/);
      if ((await button.getAttribute("aria-pressed")) !== initial)
        await button.click();
      await expect(button).toHaveAttribute("aria-pressed", initial ?? "false");
      await expect(button).toHaveAttribute("aria-busy", "false");
    }
  });

  test("designer follow toggle persists in subscriptions and can be restored", async ({
    page,
  }) => {
    await page.goto("/ua/designers");
    const designer = page
      .locator(
        'a[aria-label][href^="/ua/designers/"]:not([href^="/ua/designers/demo_studio?"])',
      )
      .first();
    const button = designer.locator("button[aria-pressed]");
    await expect(button).toBeEnabled();
    await expect(button).toHaveAttribute("aria-pressed", /^(true|false)$/);
    const initial = await button.getAttribute("aria-pressed");
    const href = await designer.getAttribute("href");
    if (!href) throw new Error("Designer card has no profile link");
    const username = new URL(href, page.url()).pathname.split("/").at(-1);
    try {
      await button.click();
      await expect(button).toHaveAttribute(
        "aria-pressed",
        String(initial !== "true"),
      );
      await expect(button).toHaveAttribute("aria-busy", "false");
      await page.goto("/ua/profile/library?tab=subscriptions");
      const subscription = page.locator(
        `a[href^="/ua/designers/${username}?"]`,
      );
      if (initial === "true") await expect(subscription).toHaveCount(0);
      else await expect(subscription).toBeVisible();
    } finally {
      await page.goto("/ua/designers");
      await expect(button).toBeEnabled();
      await expect(button).toHaveAttribute("aria-pressed", /^(true|false)$/);
      if ((await button.getAttribute("aria-pressed")) !== initial)
        await button.click();
      await expect(button).toHaveAttribute("aria-pressed", initial ?? "false");
      await expect(button).toHaveAttribute("aria-busy", "false");
    }
  });

  test("profile bio save survives reload and updates the public designer page", async ({
    page,
  }) => {
    await page.goto("/ua/profile/settings");
    const bio = page.getByLabel("Про себе", { exact: true });
    const save = page.getByRole("button", {
      name: "Зберегти зміни",
      exact: true,
    });
    await expect(bio).toBeVisible();
    const original = await bio.inputValue();
    const updated = "Playwright E2E: тимчасовий опис профілю.";
    try {
      await bio.fill(updated);
      await save.click();
      await expect(
        page.getByText("Зміни успішно збережено.", { exact: true }),
      ).toBeVisible();
      await expect(save).toBeDisabled();
      await page.reload();
      await expect(bio).toHaveValue(updated);
      await page.goto("/ua/designers/demo_studio");
      await expect(page.getByText(updated, { exact: true })).toBeVisible();
    } finally {
      await page.goto("/ua/profile/settings");
      await expect(bio).toBeVisible();
      if ((await bio.inputValue()) !== original) {
        await bio.fill(original);
        await expect(save).toBeEnabled();
        await save.click();
        await expect(
          page.getByText("Зміни успішно збережено.", { exact: true }),
        ).toBeVisible();
      }
      await expect(save).toBeDisabled();
      await page.reload();
      await expect(bio).toHaveValue(original);
    }
  });
});

test.describe("profile — authenticated", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!isDemoSessionAvailable(), "Demo user session is unavailable");

  test.use({ storageState: STORAGE_STATE_PATH });

  test("overview page renders heading and plan badge", async ({
    profileOverviewPage,
  }) => {
    await profileOverviewPage.open();
    await profileOverviewPage.expectLoaded();
  });

  test("overview shows stat cards", async ({ profileOverviewPage }) => {
    await profileOverviewPage.open();
    await profileOverviewPage.expectLoaded();
    await expect(profileOverviewPage.cards).toHaveCount(4);
  });

  test("settings page renders heading", async ({ profileSettingsPage }) => {
    await profileSettingsPage.open();
    await profileSettingsPage.expectLoaded();
  });

  test("library renders its tabs and preserves tab selection after reload", async ({
    profileLibraryPage,
  }) => {
    await profileLibraryPage.open();
    await profileLibraryPage.expectLoaded();
    await expect(profileLibraryPage.tabs.getByRole("tab")).toHaveCount(3);
    const favorites = profileLibraryPage.tabs.getByRole("tab", {
      name: /^Улюблені моделі /,
    });
    await favorites.click();
    await expect(profileLibraryPage.page).toHaveURL(/tab=favoriteModels/);
    await expect(favorites).toHaveAttribute("aria-selected", "true");
    await profileLibraryPage.page.reload();
    await expect(favorites).toHaveAttribute("aria-selected", "true");
    await profileLibraryPage.tabs
      .getByRole("tab", { name: /^Підписки / })
      .click();
    await expect(profileLibraryPage.page).toHaveURL(/tab=subscriptions/);
  });

  test("uploads page separates private drafts from uploaded models and opens the editor", async ({
    profileUploadsPage,
  }) => {
    await profileUploadsPage.open();
    await profileUploadsPage.expectLoaded();
    await expect(profileUploadsPage.draftsHeading).toBeVisible();
    await expect(profileUploadsPage.uploadedModelsHeading).toBeVisible();
    await profileUploadsPage.createModelLink.click();
    await expect(profileUploadsPage.page).toHaveURL(
      /\/ua\/profile\/uploads\/new$/,
    );
    await expect(
      profileUploadsPage.page.getByLabel("Назва українською"),
    ).toBeEnabled();
    await expect(
      profileUploadsPage.page.getByRole("button", {
        name: "Зберегти чернетку",
      }),
    ).toBeDisabled();
    await expect(
      profileUploadsPage.page.getByRole("button", {
        name: "Опублікувати",
        exact: true,
      }),
    ).toBeDisabled();
  });

  test("sidebar navigation: overview → settings", async ({
    profileOverviewPage,
    profileSidebarNav,
  }) => {
    await profileOverviewPage.open();
    await profileOverviewPage.expectLoaded();
    await profileSidebarNav.settingsLink.click();
    await expect
      .poll(() => new URL(profileOverviewPage.page.url()).pathname)
      .toBe("/ua/profile/settings");
  });

  test("sidebar navigation: overview → library", async ({
    profileOverviewPage,
    profileSidebarNav,
  }) => {
    await profileOverviewPage.open();
    await profileOverviewPage.expectLoaded();
    await profileSidebarNav.libraryLink.click();
    await expect
      .poll(() => new URL(profileOverviewPage.page.url()).pathname)
      .toBe("/ua/profile/library");
  });

  test("sidebar navigation: overview → uploads", async ({
    profileOverviewPage,
    profileSidebarNav,
  }) => {
    await profileOverviewPage.open();
    await profileOverviewPage.expectLoaded();
    await profileSidebarNav.uploadsLink.click();
    await expect
      .poll(() => new URL(profileOverviewPage.page.url()).pathname)
      .toBe("/ua/profile/uploads");
  });

  test("sidebar shows sign-out button", async ({
    profileOverviewPage,
    profileSidebarNav,
  }) => {
    await profileOverviewPage.open();
    await expect(profileSidebarNav.signOutButton).toBeVisible();
  });

  test("sign out redirects to home", async ({
    profileOverviewPage,
    profileSidebarNav,
  }) => {
    await profileOverviewPage.open();
    await profileOverviewPage.expectLoaded();
    await profileSidebarNav.signOutButton.click();
    await expect
      .poll(() => new URL(profileOverviewPage.page.url()).pathname)
      .toMatch(/^\/ua(\/|$)/);
  });
});
