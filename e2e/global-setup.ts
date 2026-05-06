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
export const STORAGE_STATE_STATUS_PATH = path.join(
  __dirname,
  ".auth",
  "demo-user-status.json",
);

type DemoSessionStatus =
  | {
      available: true;
    }
  | {
      available: false;
      reason: string;
    };

export default async function globalSetup() {
  const authDir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  fs.rmSync(STORAGE_STATE_PATH, { force: true });
  fs.rmSync(STORAGE_STATE_STATUS_PATH, { force: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL, locale: "uk-UA" });

  try {
    await page.goto("/ua/login", { waitUntil: "domcontentloaded" });
    await page.screenshot({
      path: "e2e/.auth/debug-login.png",
      fullPage: true,
    });
    await page.waitForSelector("#email", { timeout: 20_000 });

    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /увійти/i }).click();

    const didLeaveLogin = await page
      .waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 20_000,
      })
      .then(() => true)
      .catch(() => false);

    const finalPath = new URL(page.url()).pathname;
    if (!didLeaveLogin || finalPath.includes("/login")) {
      await page.screenshot({
        path: "e2e/.auth/debug-login-failed.png",
        fullPage: true,
      });
      const alertText = (await page.getByRole("alert").allTextContents())
        .join(" ")
        .trim();
      const reason = [
        `Global setup: demo login did not leave ${finalPath}.`,
        alertText ? `Visible alert: ${alertText}` : null,
        "Auth-required tests will be skipped.",
      ]
        .filter(Boolean)
        .join(" ");

      writeDemoSessionStatus({ available: false, reason });
      return;
    }

    await page.context().storageState({ path: STORAGE_STATE_PATH });
    writeDemoSessionStatus({ available: true });
  } finally {
    await browser.close();
  }
}

export function isDemoSessionAvailable() {
  if (!fs.existsSync(STORAGE_STATE_STATUS_PATH)) {
    return false;
  }

  const parsed: unknown = JSON.parse(
    fs.readFileSync(STORAGE_STATE_STATUS_PATH, "utf8"),
  );

  return (
    isDemoSessionStatus(parsed) &&
    parsed.available &&
    fs.existsSync(STORAGE_STATE_PATH)
  );
}

function writeDemoSessionStatus(status: DemoSessionStatus) {
  fs.writeFileSync(
    STORAGE_STATE_STATUS_PATH,
    `${JSON.stringify(status, null, 2)}\n`,
    "utf8",
  );
}

function isDemoSessionStatus(value: unknown): value is DemoSessionStatus {
  if (!value || typeof value !== "object") {
    return false;
  }

  const status = value as { available?: unknown; reason?: unknown };

  return (
    status.available === true ||
    (status.available === false && typeof status.reason === "string")
  );
}
