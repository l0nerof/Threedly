import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const publicationFixture = {
  titleUa: "E2E — тестова модель Playwright",
  titleEn: "E2E Playwright model",
  descriptionUa: "Тестова модель для наскрізної перевірки публікації.",
  descriptionEn: "A deterministic model for the publication browser test.",
  source: {
    name: "playwright-triangle.obj",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("o Triangle\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n"),
  },
  cover: {
    name: "playwright-cover.png",
    mimeType: "image/png",
    buffer: readFileSync(resolve(process.cwd(), "public/logo.png")),
  },
  invalidSource: {
    name: "unsupported.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("unsupported test file"),
  },
};

export const localMutationTestsEnabled =
  process.env.THREEDLY_E2E_LOCAL_MUTATIONS === "1";

export const demoCredentials = {
  email: process.env.THREEDLY_DEMO_USER_EMAIL ?? "demo@threedly.local",
  password: process.env.THREEDLY_DEMO_USER_PASSWORD ?? "ThreedlyDemo123!",
};
