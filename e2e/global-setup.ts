import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const email = process.env.THREEDLY_DEMO_USER_EMAIL ?? "demo@threedly.local";
const password = process.env.THREEDLY_DEMO_USER_PASSWORD ?? "ThreedlyDemo123!";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export const STORAGE_STATE_PATH = path.join(
  __dirname,
  ".auth",
  "demo-user.json",
);

export default async function globalSetup() {
  const authDir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL, locale: "uk-UA" });

  await page.goto("/ua/login", { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: "e2e/.auth/debug-login.png", fullPage: true });
  await page.waitForSelector("#email", { timeout: 20_000 });

  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /увійти/i }).click();

  // Wait for navigation away from the login page (login success redirects elsewhere)
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 20_000,
  });

  const finalPath = new URL(page.url()).pathname;
  if (finalPath.includes("/login")) {
    await page.screenshot({
      path: "e2e/.auth/debug-login-failed.png",
      fullPage: true,
    });
    throw new Error(
      `Global setup: login failed — still on ${finalPath}. ` +
        `Check that the demo user exists (run: npm run db:seed).`,
    );
  }

  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
