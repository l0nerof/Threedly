# E2E Tests

This project uses `Playwright` for end-to-end coverage.

## Structure

```text
e2e/
  fixtures/     Shared Playwright fixtures
  pages/        Page objects grouped by route/feature
  tests/        Specs that compose fixtures and page objects
```

## Current Coverage

- `smoke.spec.ts` verifies the default locale redirect and the main navigation path from home to pricing.

## Commands

```bash
npm run e2e:install
npm run e2e
npm run e2e:headed
npm run e2e:ui
```

## Local Workflow

- By default, Playwright starts the app through `node ./scripts/local-supabase.mjs dev --remote`.
- This keeps e2e lightweight and avoids booting local Supabase containers for public-page smoke tests.
- The browser context is pinned to `uk-UA` so locale-sensitive smoke tests stay deterministic.
- If you already have the app running on `http://localhost:3000`, Playwright will reuse that server instead of starting a new one.
- For the built-in web server mode, keep valid remote Supabase credentials in `.env.local`.

## Authoring Notes

- Prefer user-facing assertions (`role`, visible text, URL, count of rendered items) over implementation details.
- Add new page objects under `e2e/pages` when a flow grows beyond a single test.
- Keep specs small and scenario-focused; reuse fixtures for shared setup.
