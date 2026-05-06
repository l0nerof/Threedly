import { expect, test } from "../fixtures";
import { STORAGE_STATE_PATH, isDemoSessionAvailable } from "../global-setup";

test.describe("not-found page", () => {
  test.skip(!isDemoSessionAvailable(), "Demo user session is unavailable");
  test.use({ storageState: STORAGE_STATE_PATH });

  test("renders for an unknown ua route", async ({ notFoundPage }) => {
    await notFoundPage.open("/ua/this-route-does-not-exist");
    await notFoundPage.expectLoaded();
  });

  test("renders for a deeply nested unknown route", async ({
    notFoundPage,
  }) => {
    await notFoundPage.open("/ua/some/deeply/nested/path");
    await notFoundPage.expectLoaded();
  });

  test("home link is present and points to root", async ({ notFoundPage }) => {
    await notFoundPage.open("/ua/this-route-does-not-exist");
    const homeLink = notFoundPage.page.getByRole("link", {
      name: /повернутися|back.to.home/i,
    });
    await expect(homeLink).toBeVisible();
    const href = await homeLink.getAttribute("href");
    expect(href).toMatch(/^\//);
  });
});
