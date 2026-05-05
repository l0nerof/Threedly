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
- In CI, Playwright switches to `node ./scripts/local-supabase.mjs dev` so e2e can run without remote Supabase secrets.
- `global-setup.ts` logs in with the demo user once and stores the session in `e2e/.auth/demo-user.json`.
  - Demo credentials are read from `THREEDLY_DEMO_USER_EMAIL` / `THREEDLY_DEMO_USER_PASSWORD` env vars (defaults: `demo@threedly.local` / `ThreedlyDemo123!`).
  - `e2e/.auth/` is gitignored.

## Smoke (`smoke.spec.ts`)

- [x] Opening `/` resolves to the default Ukrainian locale route `/ua`
- [x] The home page renders its main hero heading
- [x] The pricing link in the header navigation is clickable
- [x] Navigating from home reaches `/ua/pricing`
- [x] The pricing page renders its primary heading
- [x] The pricing page renders the three plan cards
- [x] The pricing page renders the FAQ section heading

## Auth (`auth.spec.ts`)

### Login

- [x] Form renders with all fields and links
- [x] Validation errors shown on empty submit
- [x] Error shown for invalid email format
- [x] Server error shown for wrong credentials
- [x] Password visibility toggle works
- [x] Navigates to signup via link
- [x] Navigates to forgot-password via link

### Signup

- [x] Form renders with all fields
- [x] Validation errors shown on empty submit
- [x] Error shown for invalid username format
- [x] Error shown for invalid email format
- [x] Navigates to login via link

### Forgot Password

- [x] Form renders
- [x] Error shown on empty submit
- [x] Error shown for invalid email format
- [x] Success message shown for valid email
- [x] Navigates back to login via link

## Designers (`designers.spec.ts`)

- [x] Designers list page renders heading
- [x] Designers list page URL is correct
- [x] Designer profile page opens by username
- [x] Unknown username renders 404

## Profile (`profile.spec.ts`)

### Unauthenticated

- [x] `/ua/profile` redirects to login
- [x] `/ua/profile/settings` redirects to login

### Authenticated (demo user session)

- [x] Overview page renders heading and plan badge
- [x] Overview page shows all stat cards
- [x] Settings page renders heading
- [x] Library page renders heading and empty state
- [x] Uploads page renders the model upload form, cover image input, and optional 3D preview input
- [x] Uploads page renders the uploaded models panel
- [x] Sidebar navigation: overview → settings
- [x] Sidebar navigation: overview → library
- [x] Sidebar navigation: overview → uploads
- [x] Sidebar shows sign-out button
- [x] Sign out redirects to home

## Not Found (`not-found.spec.ts`)

- [x] Unknown UA route renders 404 page
- [x] Deeply nested unknown route renders 404 page
- [x] Home link is visible and has a valid href

## Locale (`locale.spec.ts`)

- [x] `/en` renders home page in English
- [x] `/en/pricing` renders pricing page in English with 3 plan cards
- [x] `/en/login` renders login form in English

## Catalog (`catalog.spec.ts`)

- [x] `/ua/catalog` renders the catalog heading and search input
- [x] Desktop viewport shows the filter sidebar shell
- [x] Mobile viewport opens the filter sheet from the toolbar
- [x] `/ua/catalog?category=chairs` preselects the matching category chip
- [x] `/ua/catalog?group=furniture` preselects the matching group chip

## Known Gaps

- [ ] No catalog result-card filtering assertions yet
- [ ] No reset-password flow coverage (requires real email link)
- [ ] No verify-email flow coverage (requires real OTP)
- [ ] No avatar upload coverage in profile settings
- [ ] No profile settings save flow coverage

## Pages And POMs

| Page / Area      | Route                  | POM                   | Spec                | Status        |
| ---------------- | ---------------------- | --------------------- | ------------------- | ------------- |
| Home             | `/`, `/ua`             | `HomePage`            | `smoke.spec.ts`     | `[x] Covered` |
| Pricing          | `/ua/pricing`          | `PricingPage`         | `smoke.spec.ts`     | `[x] Covered` |
| Login            | `/ua/login`            | `LoginPage`           | `auth.spec.ts`      | `[x] Covered` |
| Signup           | `/ua/signup`           | `SignupPage`          | `auth.spec.ts`      | `[x] Covered` |
| Forgot Password  | `/ua/forgot-password`  | `ForgotPasswordPage`  | `auth.spec.ts`      | `[x] Covered` |
| Designers List   | `/ua/designers`        | `DesignersPage`       | `designers.spec.ts` | `[x] Covered` |
| Designer Profile | `/ua/designers/:user`  | `DesignerProfilePage` | `designers.spec.ts` | `[x] Covered` |
| Profile Overview | `/ua/profile`          | `ProfileOverviewPage` | `profile.spec.ts`   | `[x] Covered` |
| Profile Settings | `/ua/profile/settings` | `ProfileSettingsPage` | `profile.spec.ts`   | `[x] Covered` |
| Profile Library  | `/ua/profile/library`  | `ProfileLibraryPage`  | `profile.spec.ts`   | `[x] Covered` |
| Profile Uploads  | `/ua/profile/uploads`  | `ProfileUploadsPage`  | `profile.spec.ts`   | `[x] Covered` |
| Not Found        | `/ua/*`                | `NotFoundPage`        | `not-found.spec.ts` | `[x] Covered` |
| EN Home          | `/en`                  | `EnHomePage`          | `locale.spec.ts`    | `[x] Covered` |
| EN Pricing       | `/en/pricing`          | `EnPricingPage`       | `locale.spec.ts`    | `[x] Covered` |
| EN Login         | `/en/login`            | `EnLoginPage`         | `locale.spec.ts`    | `[x] Covered` |
| Catalog          | `/ua/catalog`          | `CatalogPage`         | `catalog.spec.ts`   | `[x] Covered` |

## Authoring Notes

- Prefer user-facing assertions such as `role`, visible text, URL transitions, and visible item counts.
- Add new page objects under `e2e/pages` when a flow grows beyond a single spec.
- Profile tests that require auth must use `test.use({ storageState: STORAGE_STATE_PATH })`.
- Keep this file updated whenever a new spec is added, removed, or broadened.
