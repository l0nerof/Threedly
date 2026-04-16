# E2E Test Coverage

This file documents the Playwright coverage in this repository and should stay in sync with the actual specs.

## Local Setup

- Run `npm run e2e:install` once to install the Chromium browser used by the suite.
- Run `npm run e2e` for a one-off run.
- Use `npm run e2e:headed` or `npm run e2e:ui` when debugging flows locally.
- By default, Playwright starts the app through `node ./scripts/local-supabase.mjs dev --remote`.
- Keep valid remote Supabase credentials in `.env.local` for the built-in web server mode.
- The browser context is pinned to `uk-UA`, so locale-sensitive smoke tests are expected to resolve `/` to `/ua`.
- If the app is already running on `http://localhost:3000`, Playwright reuses the existing server automatically.

## Smoke (`smoke.spec.ts`)

- [x] Opening `/` resolves to the default Ukrainian locale route `/ua`
- [x] The home page renders its main hero heading
- [x] The pricing link in the header navigation is clickable
- [x] Navigating from home reaches `/ua/pricing`
- [x] The pricing page renders its primary heading
- [x] The pricing page renders the three plan cards

## Known Gaps

- [ ] No English-locale smoke coverage yet
- [ ] No direct route coverage yet for `catalog`, `designers`, or auth pages
- [ ] No profile-area e2e coverage yet
- [ ] No not-found / error-state coverage yet
- [ ] No accessibility coverage yet

## Pages And POMs

| Page / Area  | Route           | POM           | Spec            | Status            |
| ------------ | --------------- | ------------- | --------------- | ----------------- |
| Home         | `/`, `/ua`      | `HomePage`    | `smoke.spec.ts` | `[x] Covered`     |
| Pricing      | `/ua/pricing`   | `PricingPage` | `smoke.spec.ts` | `[x] Covered`     |
| Catalog      | `/ua/catalog`   | -             | -               | `[ ] Not covered` |
| Designers    | `/ua/designers` | -             | -               | `[ ] Not covered` |
| Login        | `/ua/login`     | -             | -               | `[ ] Not covered` |
| Signup       | `/ua/signup`    | -             | -               | `[ ] Not covered` |
| Profile area | `/ua/profile/*` | -             | -               | `[ ] Not covered` |

## Authoring Notes

- Prefer user-facing assertions such as `role`, visible text, URL transitions, and visible item counts.
- Add new page objects under `e2e/pages` when a flow grows beyond a single spec.
- Keep this file updated whenever a new spec is added, removed, or broadened.
