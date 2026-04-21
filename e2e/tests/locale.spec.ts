import { test } from "../fixtures";

test.describe("english locale", () => {
  test("home page renders in english", async ({ enHomePage }) => {
    await enHomePage.open();
    await enHomePage.expectLoaded();
  });

  test("pricing page renders in english", async ({ enPricingPage }) => {
    await enPricingPage.open();
    await enPricingPage.expectLoaded();
  });

  test("login page renders in english", async ({ enLoginPage }) => {
    await enLoginPage.open();
    await enLoginPage.expectLoaded();
  });
});
