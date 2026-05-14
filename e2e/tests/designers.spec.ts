import { expect, test } from "../fixtures";
import { STORAGE_STATE_PATH, isDemoSessionAvailable } from "../global-setup";

test.describe("designers list page", () => {
  test("renders the page heading", async ({ designersPage }) => {
    await designersPage.open();
    await designersPage.expectLoaded();
  });

  test("has correct url", async ({ designersPage }) => {
    await designersPage.open();
    await expect
      .poll(() => new URL(designersPage.page.url()).pathname)
      .toBe("/ua/designers");
  });

  test("preselects portfolio focus group from URL", async ({ page }) => {
    await page.goto("/en/designers?groups=furniture");

    await expect(
      page
        .getByLabel("Active filters")
        .getByRole("button", { name: /Furniture/i }),
    ).toBeVisible();
  });
});

test.describe("designer profile page", () => {
  test.skip(!isDemoSessionAvailable(), "Demo user session is unavailable");
  test.use({ storageState: STORAGE_STATE_PATH });

  test("opens a designer profile by username", async ({
    designerProfilePage,
  }) => {
    await designerProfilePage.open("demo_studio");
    await designerProfilePage.expectLoaded("demo_studio");
  });

  test("renders placeholder for unknown username", async ({
    designerProfilePage,
  }) => {
    await designerProfilePage.open("this-user-does-not-exist-xyz");
    await expect(
      designerProfilePage.page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
  });
});
