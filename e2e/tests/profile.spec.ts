import { expect, test } from "../fixtures";
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
    await expect(profileOverviewPage.cards).toHaveCount(6);
  });

  test("settings page renders heading", async ({ profileSettingsPage }) => {
    await profileSettingsPage.open();
    await profileSettingsPage.expectLoaded();
  });

  test("library page renders heading and empty state", async ({
    profileLibraryPage,
  }) => {
    await profileLibraryPage.open();
    await profileLibraryPage.expectLoaded();
    await expect(profileLibraryPage.cards).toHaveCount(1);
  });

  test("uploads page renders the model upload form", async ({
    profileUploadsPage,
  }) => {
    await profileUploadsPage.open();
    await profileUploadsPage.expectLoaded();
    await expect(profileUploadsPage.uploadTitleUaInput).toBeVisible();
    await expect(profileUploadsPage.uploadTitleEnInput).toBeVisible();
    await expect(profileUploadsPage.uploadCoverImageInput).toBeVisible();
    await expect(profileUploadsPage.uploadModelFileInput).toBeVisible();
    await expect(profileUploadsPage.uploadPreviewModelFileInput).toBeVisible();
    await expect(profileUploadsPage.uploadSubmitButton).toBeVisible();
    await expect(profileUploadsPage.uploadedModelsHeading).toBeVisible();
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
