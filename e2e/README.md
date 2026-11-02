# E2E Test Coverage

This file documents the Playwright coverage in this repository and should stay in sync with the actual specs.

## Publication Editor UX — 2 November 2026

`publication.spec.ts` registers browser checks for the approved editor follow-up:

- Category search by category and group, case-insensitive group matching, empty results, Escape/focus, keyboard selection and clearing the selected category. Rapid reopening after Escape uses the current search query.
- Readiness progressing from zero to five required items without optional descriptions, with Publish disabled until source and cover are selected; preview/return preserves that readiness and the unsaved route.
- Computed Input/Textarea padding in desktop/mobile editor checks and the preview return control's actual left position in both viewport checks.
- Draft-list deletion through the real confirmation dialog: cancellation preserves the row, confirmed deletion removes it and reload does not restore it.
- Published success remains distinct after reload, with My models / Create another navigation and no draft progress, save hints or cleanup retry once cleanup is confirmed.

The targeted real-local publication suite passed **7/7**. Earlier full attempts stopped on five-second login/save URL assertions despite successful Auth/Storage operations. The login setup now waits for the actual home navigation with `page.waitForURL(..., { waitUntil: "commit" })`; the save helper waits for the non-busy form, disabled Save and confirmed saved text before the draft navigation commits. This reuses the recovery POM's operation-completion pattern within the existing test budgets, including the existing 90-second file-publication scenario. No sleep, global timeout increase or mock was added. Dev output also reported Turbopack waiting for filesystem updates to settle on Playwright trace JPEGs under `output/`; this is evidence of development filesystem pressure, not a demonstrated production Auth/Storage failure.

The final full Chromium run passed **95/95**, with **zero unexpected, zero flaky and zero skipped**, in **8.7 minutes**. The JSON result has no global errors and `.last-run.json` reports `passed`. Artifacts: `output/playwright/publication-ux-complete/`, `output/playwright/publication-ux-complete-report/` and `output/playwright/publication-ux-complete-results.json`. Five layouts were visually inspected: desktop readiness and preview return, mobile editor readiness and preview, and published success. The final run's desktop/mobile readiness and published-success screenshots were inspected again. This establishes the captured Chromium layouts, not every viewport, theme, interaction, physical mobile device or browser.

Final read-only local cleanup verification: **16 profiles, 50 models, 16 Auth users and two Storage objects**, matching the pre-run user-data baseline. Unfinished drafts, isolated test Auth users/profiles/models and draft-bucket objects are all zero. One draft left when the earlier save helper threw before returning its path was identified from its trace and deleted through the real UI by exact ID and test title; no broad deletion was used. Retained published bookkeeping and charged download history follow existing product rules. Persistent scenarios use the local-write opt-in and real browser login/actions/Storage; no network, framework or browser behavior is mocked. Production is untouched. The older 49-model/zero-object snapshots and 93/93 result below retain their original dates.

## Email QA — completed Chromium run, 27 October 2026

The full real-local Chromium suite completed on 27 October: **93/93 expected, zero unexpected, zero flaky and zero skipped**, in 8.9 minutes. The saved HTML report and `output/playwright/email-cooldown-final/.last-run.json` were verified on 28 October; the implementation/test files predate that completed run. Artifacts are in `output/playwright/email-cooldown-final/`. This includes eight new real-mail scenarios and all previous marketplace/profile/publication coverage.

The suite exposed a real cooldown defect: the button still showed 20 seconds after a 65-second wait. With separate user approval, `VerifyEmailForm` now uses a deadline, refreshes on focus/visibility and starts another deadline only after successful resend. Eight unit regressions cover delayed callbacks, rounding, pending/success/failure, missing email and cleanup. Typecheck, production build, **693/693 unit tests in 49 files** and source/scoped E2E lint passed; source lint retains seven existing warnings. A fresh dev server was started after build. OTP-error, reset-success and resend-ready screenshots were visually inspected; broader manual/cross-browser review remains.

All test teardown checks passed, including isolated account/profile/avatar/mail cleanup. The last direct local reads before the final full run confirmed 16 Auth users, 16 profiles, 49 models, zero Storage objects, zero email-test accounts and zero messages for the test recipient; the Auth restart retained all three custom Storage triggers. An additional aggregate SQL/Mailpit check on 28 October was unavailable because Docker was stopped, so those earlier counts are not a new post-run snapshot. Production Auth, SQL migrations and dependencies were not changed.

## Dependency Verification — 27 October 2026

Next.js/eslint-config-next 16.4.3, Zod 4.6.6 and shadcn CLI 4.22.2 are installed; full and production npm audits report zero known vulnerabilities. Typecheck, 685 unit tests, production build and the full **76/76 Chromium suite without skips** passed. User-approved React fixes address all 11 errors exposed by the new lint preset; lint has zero errors and seven warnings. A fresh local dev server was started after build. No E2E assertions or coverage changed in this package.

## Previous completed local verification — profile package, 27 October 2026

- Full Chromium run with local writes enabled on Next.js 16.4.3: **85 passed, no skips** (6.6 minutes). This includes the prior 76-scenario suite plus nine isolated profile-settings scenarios. The profile package also passed separately, 9/9. Recovery setup waits for the actual non-busy form state before checking the saved draft URL; its earlier five-second URL assertion could run while files were still transferring. Full-run artifacts are in `output/playwright/profile-settings-full/`.
- Typecheck and unit suite **685/685** in 48 files passed again for this test package. The earlier production build passed after the approved React fixes; application code and dependencies did not change in the profile package. Source lint with generated report/output directories excluded had no errors and seven existing warnings; scoped lint also passed for the changed E2E fixture, POM and spec. Plain lint includes Playwright's vendor bundles as explained below.
- Read-only local DB verification after cleanup: 16 profiles, 49 models, zero Storage objects, zero unfinished drafts, zero test models and zero isolated test Auth accounts/profiles. Demo bio, two favorites and three original designer follows were restored. Published bookkeeping and used monthly quota follow existing product retention rules. The isolated access/quota scenarios leave no usage in the demo account; the older publication lifecycle scenario still uses the demo account's real monthly quota.
- Screenshots cover mobile unsaved preview, the published test model, saved profile settings and a replaced mobile avatar. Profile desktop/mobile screenshots were visually inspected; this does not establish every viewport or interaction. Fixed dialogs use viewport screenshots to avoid misleading full-page capture placement. The HTML report is replaced by each Playwright invocation; use the full-suite command below when generating a report for all scenarios.
- Historical note from 26 October: a long-lived Next 16.3.8 dev process stalled on demo-login navigation despite a successful server result and home-page responses; a restart restored the 76/76 run, without changing login code/timeouts. Its precise cause was not established. On 27 October, the fresh Next 16.4.3 dev/full run passed 76/76. Existing motion/scroll warnings remain. This passing Chromium suite does not establish production readiness or replace the remaining cases listed below.

## Local Setup

- Run `npm run e2e:install` once to install the Chromium browser used by the suite.
- Run `npm run e2e` for a one-off run.
- Use `npm run e2e:headed` or `npm run e2e:ui` when debugging flows locally.
- By default, Playwright starts the app through `node ./scripts/local-supabase.mjs dev --remote`.
- Keep valid remote Supabase credentials in `.env.local` for the built-in web server mode.
- The browser context is pinned to `uk-UA`, so locale-sensitive smoke tests are expected to resolve `/` to `/ua`.
- If the app is already running on `http://localhost:3000`, Playwright reuses the existing server automatically.
- Playwright runs with one worker to avoid Next dev cache races and keep app-server state deterministic.
- In CI, Playwright switches to `node ./scripts/local-supabase.mjs dev` so e2e can run without remote Supabase secrets.
- `global-setup.ts` logs in with the demo user once and stores the session in `e2e/.auth/demo-user.json`.
  - Demo credentials are read from `THREEDLY_DEMO_USER_EMAIL` / `THREEDLY_DEMO_USER_PASSWORD` env vars (defaults: `demo@threedly.local` / `ThreedlyDemo123!`).
  - `e2e/.auth/` is gitignored.
- Shared Playwright exports live in `e2e/fixtures`; specs should import `test` and `expect` from there.
- Playwright tests should not mock browser APIs, Next.js routing, Supabase clients, `fetch`, timers, or third-party UI/library behavior. Use the real app server and deterministic demo/seeded data instead.
- Auth-required specs call `isDemoSessionAvailable()` and skip when the configured Supabase environment does not have the demo user.

### Publication flows with real local writes

Start `npm run dev` against local Supabase first. Opt into persistent publication and profile interaction scenarios in PowerShell:

```powershell
$env:PLAYWRIGHT_WEB_SERVER_COMMAND = 'node ./scripts/local-supabase.mjs dev'
$env:THREEDLY_E2E_LOCAL_MUTATIONS = '1'
npx --no-install playwright test --max-failures=1 --trace=on
```

After trace/report generation, exclude generated bundles when linting source:

```powershell
npm run lint -- --ignore-pattern 'playwright-report/**' --ignore-pattern 'test-results/**' --ignore-pattern 'output/**'
```

The repository's existing ESLint config does not exclude these generated directories. Plain `npm run lint` can report errors in Playwright's bundled report viewer after an E2E run. No ESLint configuration is changed by this test package.

Only set `THREEDLY_E2E_LOCAL_MUTATIONS=1` with the local Supabase stack, never with `dev:remote` or production. Without this opt-in, the scenarios that save/publish/delete are explicitly skipped. They use real browser login, server actions, Storage uploads, downloaded bytes and the seeded Pro account; no routes, SDKs, browser APIs, network or timers are mocked. Each authenticated publication scenario signs in again so it does not depend on another test's sign-out.

Fixtures use fixed bilingual text, a small valid OBJ triangle and the repository's PNG logo. Cleanup targets only the draft path/model created by that scenario. Publishing/downloading uses one real monthly quota unit; repeat downloads must not use another. Model deletion intentionally does not refund quota. Existing product bookkeeping/tombstones can remain after cleanup; tests do not reset the database or rewrite quota history. A failed cleanup is a test failure and requires inspection before retrying.

## Smoke (`smoke.spec.ts`)

- [x] Opening `/` resolves to the default Ukrainian locale route `/ua`
- [x] The home page renders its main hero heading
- [x] The pricing link in the header navigation is clickable
- [x] Navigating from home reaches `/ua/pricing`
- [x] The pricing page renders its primary heading
- [x] The pricing page renders the three plan cards
- [x] The pricing page renders the FAQ accordion section

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

## Email Auth (`email-auth.spec.ts`)

Eight scenarios exercise real local Auth mail through Mailpit and the application. They require the local-write opt-in, `auth.email.enable_confirmations = true`, the checked-in confirmation template, and a restarted local stack. The shared status reader accepts only the local API on port 54321 and Mailpit on 54324. No mail, SDK, browser, network or timer behavior is mocked.

- Signup sends a real six-digit code, leaves the account unconfirmed and blocks password login/private routes until confirmation. A wrong code is rejected; the correct code establishes a session and a Free profile with five downloads and no creator permission.
- A used signup code cannot establish a session in another browser context.
- Resend is disabled during the real 60-second cooldown. A subsequent received message contains a working code and the button enters cooldown again. The test waits for the button state, without overriding time.
- Verification without an email cannot submit or resend; a direct reset route without a session shows the invalid-link state.
- Password recovery opens the actual email link in the requesting browser, validates empty/mismatched/same-password input, saves a new password, signs out and returns to login with success feedback. The old password fails, the new password works, and the used link cannot open a fresh recovery session.
- English recovery preserves `/en` through the email destination, password reset and new login.
- A corrupted recovery token is rejected and the original password still works.

`local-email-auth.ts` refuses an existing test account and verifies ownership before deleting anything. It excludes messages that existed at setup, scopes mail searches and individual deletion IDs to its exact recipient, revokes confirmed-user sessions, deletes the owned Auth user and verifies profile removal. Account and mail cleanup are attempted independently after failures; an empty Mailpit deletion request is never sent. These tests use the actual Mailpit v1 contract and the repository's single worker; concurrent independent runs with the fixed address require separate local stacks. They do not demonstrate external SMTP delivery, a full-hour token expiry or recovery in a different browser/device. Reset assertions check the pathname and the actual password/session outcome; removal of the SDK's one-time `code` query parameter is not a completion condition. Desktop error/success screenshots and traces accompany the run.

## Designers (`designers.spec.ts`)

- [x] Designers list page renders heading
- [x] Designers list page URL is correct
- [x] `/en/designers?groups=furniture` preselects the matching portfolio focus chip
- [x] Designer profile page opens by username
- [x] Unknown username renders 404

## Profile (`profile.spec.ts`)

### Unauthenticated

- [x] `/ua/profile` redirects to login
- [x] `/ua/profile/settings` redirects to login

### Authenticated (demo user session)

- [x] Overview page renders heading and plan badge
- [x] Overview page shows the seeded Pro badge and four accessible statistic groups
- [x] Settings page renders heading
- [x] Library renders three tabs, URL transitions and selection persistence after reload
- [x] Uploads separates private drafts and existing models and opens the manual-save editor
- [x] Uploads page renders the uploaded models panel
- [x] Sidebar navigation: overview → settings
- [x] Sidebar navigation: overview → library
- [x] Sidebar navigation: overview → uploads
- [x] Sidebar shows sign-out button
- [x] Sign out redirects to home
- [x] Favorite and designer-follow changes persist in library tabs and restore their initial values
- [x] Profile bio changes survive reload, appear on the public designer page and are restored after the test

## Profile Settings (`profile-settings.spec.ts`)

Nine scenarios use the existing `localMarketplace` fixture and local-write opt-in. They create isolated accounts rather than changing the demo profile. All edits go through the real UI, server actions, Auth and Storage; Node-side, Zod-validated reads verify the persisted profile and file bytes.

- [x] Username and bio save, whitespace/case normalization and persistence after reload; email remains read-only and Save is disabled for the saved form.
- [x] An anonymous browser sees the renamed public profile and updated bio; the former username no longer resolves to that profile.
- [x] Taken, empty, too-short, too-long and unsupported-character usernames fail without partially saving the bio; rejected input remains editable and reload restores the saved values.
- [x] On a 390 px viewport, the avatar menu opens a real file chooser; uploading an avatar preserves an unsaved bio until explicit Save.
- [x] Upload, replacement with a different valid PNG, image decoding, persisted paths and exact Storage bytes are checked. Replacement removes the old object rather than accumulating files.
- [x] An anonymous browser renders the avatar; removal clears the public image, profile reference and Storage bytes, including after reload.
- [x] SVG and a file larger than 5 MiB produce a visible failure while preserving the previous avatar bytes and unsaved bio.

Fixture teardown now discovers all avatar objects under the IDs created by the current test, including unreferenced files, removes them through the Storage API before deleting Auth users, and verifies that none remain. Fixed account collisions still fail rather than reusing existing users. This covers normal avatar operations and validation failures, not interrupted transfers, a failed profile update after upload, or a failed old-file deletion. Desktop/mobile screenshots and traces accompany the run; this is not a full accessibility or cross-browser review.

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
- [ ] No external SMTP delivery, full-hour email-token expiry or cross-device recovery coverage
- [ ] No avatar transport-failure or partial-operation recovery coverage
- [ ] No browser coverage for interruption after measured upload bytes, lost Storage copy responses, cancellation races or expired cover URLs
- [ ] No full keyboard/accessibility, cross-browser, slow-network or visual-regression suite
- [ ] No browser coverage for favorite/follow transport failures or published-model mutation conflicts

## Marketplace Access (`marketplace-access.spec.ts`)

Seven registered scenarios use `localMarketplace` with the same local-write opt-in. Every scenario creates its own owner/reader/other accounts; fixed test emails fail explicitly on collision and never take over an existing account. This fixture reads and validates local CLI status in Node, accepts only the local API on port 54321, and keeps the service-role key out of the browser and reports. It uses the generated database types, Zod-validated responses and actual Auth/Data/Storage APIs. Browser actions exercise the real application; authenticated SDK reads additionally verify private-file access.

- Guest download denial, with no downloaded file.
- Free → Pro denial, unchanged download history and available quota.
- Five distinct Free downloads with byte checks, sixth-model denial, repeat download allowed at exhausted quota and exactly five history rows.
- New upload page denies an account without creator permission.
- A private source/cover exists and is readable by its owner, but another creator cannot read either file or open the draft route.
- Revocation while an editor is open rejects replacement-file upload, preserves active assets, permits saving existing text and permits deletion.
- Revocation while a complete draft is open rejects publication without creating a public model.

Fixture teardown discovers owned private/public assets, removes bytes through Storage API, deletes only created model rows, revokes sessions and deletes only created Auth accounts. It also verifies profile removal, reports cleanup failures and runs after test failures or partial setup. No SQL Storage deletion, schema changes, remote credentials, data reset or demo-profile mutation are involved. Tests are registered for the repository's single-worker configuration; parallel independent runs using the same fixed emails must use separate local stacks.

## Publication (`publication.spec.ts`)

- [x] Guest editor access redirects to login
- [x] Unsupported source file produces a visible error and cannot enable save/publication
- [x] Searchable category/group selection supports empty results, keyboard selection, Escape/focus and clearing
- [x] Five-item readiness follows actual titles/category/files without requiring optional descriptions or saving
- [x] Desktop/mobile text controls have computed padding and the preview return action is on the left
- [x] Mobile bilingual preview uses unsaved text, disables downloads and restores focus/content on Escape
- [x] Preview does not create a visible draft in another real browser page
- [x] Leaving with changes prompts for confirmation; staying preserves input
- [x] Explicit partial save survives reload, reopens from My Models and supports confirmed deletion
- [x] Draft-list deletion can be cancelled; confirmation removes the saved row through reload
- [x] Real OBJ/PNG selection, preview file listing, private asset save and reload
- [x] Complete unchanged draft publishes and becomes searchable in the public catalog
- [x] Published success and its next-action links survive reload without draft hints or readiness progress
- [x] File-specific browser downloads match the uploaded bytes and filename
- [x] Repeated downloads consume one monthly quota unit and appear in the library
- [x] Published metadata editing updates the public page; archiving hides it and republishing restores it
- [x] Confirmed cleanup removes the created draft/published model through actual application controls

These checkboxes describe registered assertions. A passing run must enable local writes and report no skips for the persistent flows; they are not evidence of complete MVP coverage by themselves. Inspect Playwright screenshots/traces as well as assertions for visual confidence.

## Publication Recovery (`publication-recovery.spec.ts`)

Seven baseline recovery scenarios passed separately in Chromium (1.1 minutes), using isolated local accounts and the local-write opt-in. The sidebar regression now passes with the real navigation provider. Five additional desktop/history/clean-save/delete scenarios also passed together (53.5 seconds). The suite now registers 14 recovery/navigation scenarios. The mobile-menu regression passed after the approved Header fix, including cancellation, confirmed navigation and a subsequent browser Back with the menu closed.

- Initial source-transfer failure preserves acknowledged text, pending source/cover selections and the original draft ID on retry.
- Failed source replacement leaves previous active bytes intact, saves acknowledged metadata and supports a real retry with byte verification.
- Two actual browser tabs retry one prepared publication and confirm one published model with its original reserved ID.
- A revision conflict preserves the stale tab's text and requires confirmation before loading the saved version; saving works after reconciliation.
- The editor's own Back dialog supports keeping edits and explicitly discarding only the unsaved version.
- A native `beforeunload` close dialog can keep the dirty tab open or confirm closing without saving its text.
- A confirmed native reload restores the saved version and does not persist unsaved edits.
- Sidebar and desktop header navigation preserve text/file-only changes on cancellation and leave only after confirmation; Escape and initial dialog focus are checked.
- Actual browser Back/Forward can be cancelled or confirmed without saving local text.
- Clean/new and successfully saved editors navigate without a dialog; confirmed deletion does not trigger a second leave prompt.
- Mobile header cancellation preserves text and leaves the menu open; confirmed navigation and subsequent browser Back close the menu.

Network failures use Chromium's native `Network.setBlockedURLs` through Playwright CDP, restored during fixture teardown. The real app, Auth, reserve/save/attach operations, Storage and browser APIs remain in use; no route fulfillment, SDK/fetch replacement or timer override is involved. This covers failure of an upload request, not interruption after a measured number of bytes. The rule targets only private source uploads, so server-action reconciliation can still reach the real app.

The frozen publication is prepared through the authenticated owner's existing `manage_publication_draft` RPC (`prepare_publish`); browser Retry controls perform real file copies/finalization. It verifies recovery of a prepared operation and concurrent retries, not a lost Storage copy response. Fixture cleanup tracks the reserved public destinations before retry, including partially copied files, and supports relative cover paths emitted by publication.

The user approved `nextjs-nav-guard@1.1.3`, its root provider and the reused shared dialog. Successful internal Save/Delete redirects commit clean state first; `router.refresh()` remains unblocked because it preserves local client state. The dependency's capture listener skips the mobile menu's original onClick callback: the approved Header fix therefore closes the menu when the actual pathname changes, including history navigation. Cancelled navigation leaves its current state intact. Browser/OS unload prompts and cross-document history are subject to native browser behavior; this suite verifies Chromium, not every mobile browser or forced app termination. The optional pre-login debug screenshot was removed from global setup with explicit approval after repeated Chromium capture failures; form/login/session verification and the failed-login screenshot are retained.

## Pages And POMs

| Page / Area      | Route                                                | POM                   | Spec                       | Status                          |
| ---------------- | ---------------------------------------------------- | --------------------- | -------------------------- | ------------------------------- |
| Home             | `/`, `/ua`                                           | `HomePage`            | `smoke.spec.ts`            | `[x] Covered`                   |
| Pricing          | `/ua/pricing`                                        | `PricingPage`         | `smoke.spec.ts`            | `[x] Covered`                   |
| Login            | `/ua/login`                                          | `LoginPage`           | `auth.spec.ts`             | `[x] Covered`                   |
| Signup           | `/ua/signup`                                         | `SignupPage`          | `auth.spec.ts`             | `[x] Covered`                   |
| Forgot Password  | `/ua/forgot-password`                                | `ForgotPasswordPage`  | `auth.spec.ts`             | `[x] Covered`                   |
| Designers List   | `/ua/designers`                                      | `DesignersPage`       | `designers.spec.ts`        | `[x] Covered`                   |
| Designer Profile | `/ua/designers/:user`                                | `DesignerProfilePage` | `designers.spec.ts`        | `[x] Covered`                   |
| Profile Overview | `/ua/profile`                                        | `ProfileOverviewPage` | `profile.spec.ts`          | `[x] Covered`                   |
| Profile Settings | `/ua/profile/settings`                               | `ProfileSettingsPage` | `profile-settings.spec.ts` | `[x] Covered`                   |
| Profile Library  | `/ua/profile/library`                                | `ProfileLibraryPage`  | `profile.spec.ts`          | `[x] Covered`                   |
| Profile Uploads  | `/ua/profile/uploads`                                | `ProfileUploadsPage`  | `profile.spec.ts`          | `[x] Covered`                   |
| Not Found        | `/ua/*`                                              | `NotFoundPage`        | `not-found.spec.ts`        | `[x] Covered`                   |
| EN Home          | `/en`                                                | `EnHomePage`          | `locale.spec.ts`           | `[x] Covered`                   |
| EN Pricing       | `/en/pricing`                                        | `EnPricingPage`       | `locale.spec.ts`           | `[x] Covered`                   |
| EN Login         | `/en/login`                                          | `EnLoginPage`         | `locale.spec.ts`           | `[x] Covered`                   |
| Catalog          | `/ua/catalog`                                        | `CatalogPage`         | `catalog.spec.ts`          | `[x] Covered`                   |
| Publication      | `/ua/profile/uploads/new`, `/ua/profile/uploads/:id` | `PublicationPage`     | `publication.spec.ts`      | `[x] Added; local-write opt-in` |

## Authoring Notes

- Prefer user-facing assertions such as `role`, visible text, URL transitions, and visible item counts.
- Prefer route, role, structure, and state-transition assertions before exact localized copy.
- Add new page objects under `e2e/pages` when a flow grows beyond a single spec.
- Demo-session profile tests use `test.use({ storageState: STORAGE_STATE_PATH })` and guard with `test.skip(!isDemoSessionAvailable(), "...")` so missing demo data does not block unrelated public flows.
- Isolated mutation tests instead use `localMarketplace`, the local-write opt-in and real browser login. They never reuse the demo session or run against remote Supabase.
- Keep this file updated whenever a new spec is added, removed, or broadened.
