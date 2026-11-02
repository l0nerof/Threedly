# Unit Test Coverage

This file documents the Vitest coverage in this repository and should stay in sync with the actual specs.

## Publication Editor UX — 2 November 2026

The approved editor follow-up adds a searchable shared Base UI Combobox, visible five-item publication readiness, optional-description labels, text-field padding, a left-aligned preview return action, confirmed deletion from the draft list and a distinct published state. The assertions and completed verification below describe this package; earlier dated totals remain historical evidence.

- `model-publication-editor.spec.tsx`: progress changes while titles/category/files remain local; undoing a cover removes its completed item; category/group search is case-insensitive, renders group context, handles no matches and clears the selection; empty descriptions remain publishable while an oversized optional description shows an error and blocks publication. A reloaded published editor has the correct heading and localized Create another link without draft hints/progress; failed cleanup remains retryable, a delayed reread keeps retry pending and a successful RPC cannot hide remaining server-side temporary records.
- `model-publication-editor-utils.spec.ts`: exactly five required items (UA title, EN title, known category, source and cover), 2–90-character title bounds, optional descriptions up to 600 characters, valid local replacements, invalid replacements over saved files and validated persisted cleanup state. All five items can be complete while invalid optional metadata still blocks publication.
- `model-publication-editor-pages.spec.tsx`: draft-list deletion requires confirmation, cancellation writes nothing, pending confirmation cannot duplicate the action, partial cleanup remains retryable, conflicts require a reread and another confirmation, failed reconciliation blocks another write, account/session changes ignore late results and deleting the last row normalizes the draft page on the server without changing model pagination.
- `model-publication-actions.spec.ts`: a published draft's cleanup state comes from the actual owner-scoped remaining asset count, including more than one cleanup batch; malformed/failed counts cannot claim success, foreign drafts are rejected before that read and unfinished lifecycles do not invent published cleanup state. The read returns no Storage paths and performs no cleanup mutation.
- `model-publication-preview.spec.tsx`: the return control precedes the preview heading in both interface locales and restores focus to its opener without persisting changes.

The readiness display and Publish eligibility use the same `publicationReadiness` result. Rapid Escape/reopen after empty results filters against the current external query, so a new group search immediately returns matching categories without a write. Published cleanup is derived by a read of existing asset rows, rather than a new database flag or migration; it is rechecked after cleanup and survives an editor reload. Unit fixtures control SDK/Next boundaries; actual CSS padding, geometry, keyboard behavior, HTTP/cookies and real Storage cleanup are separately verified by the browser checks in `e2e/README.md`. Production is untouched.

Verification on 2 November: **735/735 unit tests in 49 files**, adding 42 checks over the previous 693-test baseline. Typecheck passed, including after the E2E helper adjustments; lint reported zero errors and seven pre-existing warnings; the Next.js 16.4.3 production build and scoped Prettier check across 26 files passed. Targeted real-local Chromium passed **7/7**; the final full run passed **95/95**, with zero unexpected, flaky or skipped tests, in 8.7 minutes. Browser artifacts and visual-review limits are documented in `e2e/README.md`.

## Email Verification Cooldown — 27 October 2026

The full suite passed **693/693 in 49 files** after adding eight checks in `verify-email-form.spec.tsx`. The real `VerifyEmailForm`, shared OTP control, next-intl messages and Sonner are rendered; only server-action/Next routing boundaries, time and missing jsdom browser APIs are controlled.

- Resend stays disabled before 60 seconds and becomes available at the deadline.
- A single delayed timer callback uses elapsed time instead of requiring all missed callbacks.
- Focus and visibility changes refresh the remaining time immediately; partial seconds round up without enabling early.
- A successful resend starts its new 60 seconds after the response, prevents duplicate pending clicks and preserves the typed OTP.
- A failed resend displays feedback, keeps the expired cooldown available and permits retry.
- Missing email remains blocked after the deadline.
- Unmount removes the interval and focus/visibility subscriptions.

`vi.setSystemTime` advances the clock without firing timers for the delayed/focus/visibility regressions. This models the drift found by real Chromium, which still displayed 20 seconds after a 65-second wait. Unit time control is not used in E2E; the browser suite waits through the actual cooldown. Typecheck, production build and lint with zero errors/seven existing warnings passed. The full Chromium run passed **93/93 without skips** on 27 October; its saved report was confirmed on 28 October. Details are recorded in `e2e/README.md`.

## Dependency Verification — 27 October 2026

The full suite passed **685/685 in 48 files** with Next.js/eslint-config-next 16.4.3, Zod 4.6.6 and shadcn CLI 4.22.2. Typecheck and production build passed; both npm audits reported zero known vulnerabilities. The real Chromium suite also passed 76/76 without skips on these dependencies. The user separately approved React compatibility fixes for the new lint preset: lint now has zero errors and seven warnings (six previous warnings plus the React Hook Form/Compiler warning; an obsolete Waves disable was removed).

Seventeen added checks cover:

- `use-url-filters.spec.ts`: typing/debounce, short input, external URL changes, unrelated URL parameters, reset and unmount without a late navigation.
- Existing catalog/designer specs: replacing only changed URL-backed draft fields and preserving other unapplied selections.
- Existing mobile hook spec: initial mobile viewports, 767/768 px boundary and the desktop SSR snapshot before the client viewport.
- `carousel.spec.tsx`: real Embla initialization, empty/single/multiple slides, button/keyboard navigation and reInit that changes scroll limits while retaining the same selected index.

`unit/mocks/url-filters.ts` controls the Next routing boundary. `unit/mocks/carousel.ts` supplies jsdom's missing layout/observer boundaries; the Embla API, React and shared controls remain real. Carousel and Waves are used by the public/auth UI, while SidebarMenuSkeleton has no current caller. These unit tests do not establish browser swiping, CSS geometry or animation fidelity; real app rendering belongs to the E2E/visual check.

## Publication Navigation Guard — 26 October 2026

The full suite passed **668/668 in 46 files** after adding four navigation checks. Editor, preview and route specs mount the real `nextjs-nav-guard@1.1.3` provider and a typed Next router boundary through `EditorNavigationProvider`; the navigation library, React, forms and shared dialog are not mocked.

- [x] Dirty text/native unload warning, cancelling editor Back and accepting the requested destination exactly once without saving.
- [x] File-only changes retain their selection after cancelling; undo and a confirmed save remove the unload warning.
- [x] A pending save allows staying in the editor and disables premature exit confirmation.
- [x] Existing creation, publication, deletion and preview checks retain their behavior.

Actual sidebar/header/history transitions, clean-page navigation, Escape/focus and native close/reload belong to the real Chromium recovery suite. The final full Chromium run passed 76/76, including the mobile-header cancellation/confirmed-navigation/Back regression. jsdom does not establish real Next.js navigation or browser history behavior.

## Publication Page Preview (`model-publication-preview*.spec.*`)

Three specs add 42 deterministic checks using the real editor, Sheet/Dialog, shared model-detail views, React Query, translations and read actions/helpers, with only existing SDK/Next boundaries and missing jsdom APIs controlled. Full suite after this stage: 664/664 in 46 files.

- [x] Unsaved titles/descriptions, access plan, bilingual content switching and explicit incomplete-draft placeholders.
- [x] Current local source/cover selection, independent blob URLs and cleanup on close/unmount without losing the editor's selected files.
- [x] No save, upload, publication, cleanup, real download or route change while previewing; no invented identity, dates, statistics or author.
- [x] Real owner-scoped author fields, avatar resolution, missing/malformed/error responses, explicit retry and shared server deadline.
- [x] Fresh private cover reads, image-error retry, safe signed URLs and rejection of an asset changed on another device without changing local text.
- [x] Escape/focus restoration in jsdom, fresh content on reopen, closed-preview late responses, changed accounts and new session revisions.
- [x] Transport cancellation/timeout and actual Next.js control-flow preservation.

Existing public hero/files tests also verify that the disabled public Preview and real Download controls retain their behavior after extracting shared presentation. Content-language switching changes model text and file-size formatting; interface labels retain the editor's current locale. jsdom checks do not establish real keyboard behavior, file bytes, HTTP/cookies, responsive/fullscreen layout or visual fidelity. Those remain for final browser/E2E QA; no dev server or browser was started.

## Publication Editor UI (`model-publication-editor*.spec.*`)

Three new specs exercise 46 checks through the actual routes/editor, React Hook Form/Zod, shared controls, React Query, translations and server actions/helpers. Reusable SDK/Next boundary fixtures and missing browser APIs live in `unit/mocks/model-publication-editor.ts`; no real network is used. An additional completed-publication list assertion extends the existing action spec. At the editor UI stage the full suite passed 622/622 in 43 files; the later preview coverage is described above.

- [x] New/existing UA/EN routes, owner/session access, invalid/missing IDs, service failures and noindex metadata.
- [x] No writes on mount, typing or file selection; explicit partial draft save and a stable create ID after failure.
- [x] Manual direct source upload, valid/invalid cover selection, local undo and blob URL cleanup.
- [x] Confirmed text/old active files retained after transfer failure, retry without repeating the confirmed metadata save.
- [x] Complete unchanged draft publication, frozen-copy retry without a new model, cancellation and confirmed deletion.
- [x] Standalone cleanup retry, unavailable categories, revoked upload access and reauthentication states.
- [x] Conflict preservation, explicit discard before loading the saved version, failed reconciliation and bounded waits.
- [x] Duplicate-write prevention, hidden stale-account editors and ignored late session results.
- [x] Expired/failed private image refresh without losing edits, editor Back confirmation and beforeunload warning.
- [x] Unfinished list states/links, independent draft pagination and completed-publication exclusion in count/range.

The SDK fixture controls responses; it is not a replacement for real-role SQL coverage or browser verification. HTTP cookies, real Storage bytes, file-picker behavior, sidebar/browser-history navigation, browser focus restoration and responsive layout remain for final QA. Page preview now has separate unit coverage above. The old upload form still has isolated component/action coverage but is no longer mounted by My Models. Existing E2E expectations for that form need updating during final QA.

## Publication Editor Backend (`model-publication-*.spec.ts`)

The four backend specs use actual schemas/actions/helpers with reusable Supabase/Next boundary mocks in `unit/mocks/model-publication.ts`. There is no real network in these tests. The backend stage initially added 77 checks (575 total at that point); the UI stage adds the completed-list filter assertion and the editor coverage above.

- [x] Partial metadata, strict field/UUID/revision/confirmation contracts, file formats and size bounds.
- [x] Canonical private/public paths and rejection of foreign, nested, traversal or encoded cleanup paths.
- [x] Create/save/reserve/attach/release intent, live Auth failures, server conflicts and Next control-flow errors.
- [x] Minimal draft reads, private signed cover validation, stable owner-scoped pages, empty/error separation and bounded recount.
- [x] Prepare/copy/finalize, duplicate-copy retry, already-published reconciliation and failure without false publication.
- [x] Validated batch cleanup, partial Storage errors, pending tombstones, shared deadlines and ignored late results.
- [x] Direct authenticated file transfer, safe replacement failure, session changes, attachment conflicts and cancellation.
- [x] No direct SDK overwrite, old-file deletion, admin key or invented successful result.

Database permissions, the final privileged Storage INSERT guard and late-copy tombstones have separate pgTAP coverage (103 new / 439 total checks). One-off local diagnostics also passed 50 actual action/SDK/Storage checks and six synchronization assertions across two SQL transaction barriers; all fixtures were removed. Those diagnostics are not CI tests or HTTP/cookie/browser verification. Editor/preview are connected locally; final E2E/manual QA remains deferred.

## Local Setup

- Run `npm run test:unit` for a one-off run.
- Run `npm run test:unit:watch` during active feature work.
- Vitest uses `jsdom` together with `React Testing Library`.
- Shared test exports live in `unit/fixtures`.
- Reusable browser and environment mocks live in `unit/mocks`.

## Shared Hooks (`use-mobile.spec.ts`)

- [x] `useIsMobile` returns `false` for a desktop viewport
- [x] `useIsMobile` flips to `true` when the viewport crosses below the mobile breakpoint
- [x] `useIsMobile` returns to `false` when the viewport goes back to desktop width
- [x] The behavior is exercised through a reusable `matchMedia` mock rather than per-test inline stubs

## Catalog UI Shell (`catalog-shell.spec.tsx`)

- [x] Mobile filter sheet opens from the catalog toolbar
- [x] Local filter state updates without any real data filtering
- [x] Category groups can be selected and pushed to the URL
- [x] Reset returns the shell to its default local state
- [x] Initial category from route state appears in the active filter UI
- [x] Initial group from route state appears in the active filter UI
- [x] Catalog query keys include group filters
- [x] Catalog filter helpers flatten grouped category options

## Designers Actions (`designers-action.spec.ts`)

- [x] Designers list loading includes published model counts for each returned designer
- [x] Designers list loading can filter creators by portfolio category groups derived from published models
- [x] Designers list loading supports real sorting by published model count and model downloads
- [x] Designers count loading deduplicates creators matched through multiple published models in the same group
- [x] Public designer profile loading returns profile data and latest published models
- [x] Missing or upload-disabled designer usernames return `null`

## Designers UI Shell (`designers-shell.spec.tsx`)

- [x] Desktop portfolio focus filters commit selected category groups to the URL

## Featured Models Copy (`featured-models-copy.spec.ts`)

- [x] Ukrainian featured models heading uses recommendation-oriented wording

## Featured Model Card (`featured-model-card.spec.tsx`)

- [x] Featured home-page model cards reuse catalog card actions and favorite control
- [x] Download is enabled and separate from the localized full-card link (no button nested in an anchor)

## Model Detail Components (`model-detail-components.spec.tsx`)

- [x] Model hero updated date follows the active locale
- [x] Model overview renders the real creator profile with initials fallback

## Designer Seed Data (`designer-seed.spec.ts`)

- [x] Seeded public designers include model assignments for profile-page QA

## Main Pages Layout (`main-pages-layout.spec.tsx`)

- [x] Short main pages stretch to the viewport height so the footer stays at the bottom

## Models Pagination (`models-pagination.spec.tsx`)

- [x] Previous and next pagination buttons render localized visible labels

## Model Upload MVP

- [x] Upload helper returns supported file extensions in lowercase
- [x] Upload helper rejects unsupported file names
- [x] Upload helper builds user/model-scoped storage paths
- [x] Upload helper builds cover image and lightweight preview paths
- [x] Upload metadata schema accepts bilingual model metadata
- [x] Upload metadata schema rejects missing titles and invalid categories
- [x] Upload server action stores source file, cover image, and model metadata through mocked Supabase
- [x] Upload server action publishes uploaded models immediately
- [x] Upload server action stores optional lightweight 3D preview paths
- [x] Upload server action rejects unsupported files before storage writes
- [x] Upload server action rejects unsupported cover and preview files before storage writes
- [x] Upload server action rejects guests, accounts without `can_upload`, and missing profiles before storage writes
- [x] Upload server action stops without writes when the upload permission query fails
- [x] Upload server action removes stored source, preview, and cover files when metadata save fails

## Profile Settings (`profile-settings-form.spec.tsx`)

- [x] Saving public profile details invalidates cached designers data

## Owned Model Management (`model-management-action.spec.ts`, `model-management-utils.spec.ts`, `model-management-ui.spec.tsx`, `profile-uploads.spec.tsx`)

- [x] Reads only validated own editor fields with explicit model/creator filters
- [x] Rejects invalid UUIDs, extra fields, missing deletion confirmation, guests and Auth failures
- [x] Saves the strict metadata whitelist and maps archive/publication to explicit RPC intent
- [x] Validates generated RPC responses, target identity, result codes and bounded unique path arrays
- [x] Rejects foreign, traversal, nested, encoded and malformed cleanup paths before any Storage call
- [x] Starts durable deletion before cleanup and finalizes only after both Storage calls succeed
- [x] Handles empty/partial batches, both bucket failures and pending/remaining-object responses without false success
- [x] Uses one deadline across Auth/RPC/Storage and prevents late responses from starting further writes
- [x] Preserves actual Next.js control-flow errors, invalidates existing route patterns and clears request timers
- [x] Validates the own-model list/profile/category boundary, exact counts, stable bounded pages, clamping and one retry after a concurrent range/count change
- [x] Separates list errors/timeouts, genuine empty accounts and unavailable categories without inventing private fields, counts or file sizes
- [x] Renders the actual uploads page, existing upload form, localized own rows, pagination and login/clamped-page redirects
- [x] Loads current editor values, validates metadata and saves only the whitelist through the real form, select and server action
- [x] Preserves unsaved values after failure, retries editor reads and ignores late responses after close/reopen
- [x] Archives/publishes with server confirmation, respects revoked publication permission and prevents duplicate pending writes
- [x] Requires explicit deletion confirmation, focuses Cancel, supports Escape cancellation and keeps pending deletion non-cancellable
- [x] Retries incomplete file cleanup without edit/publication controls or false success; requires a reread when the mutation and reconciliation are both unconfirmed
- [x] Invalidates existing client data, refreshes server data, displays actual UA/EN toasts and ignores another session's results
- [x] Closes private editor/confirmation UI and hides old list rows after an account change; does not reuse old session state on return

Shared Supabase/Next boundary fixtures and the missing jsdom `scrollIntoView` polyfill live in `unit/mocks/model-management.ts`. Tests use real React Query, React Hook Form, Zod, translations, Radix/shared UI and Sonner; no real network or server-action/component mocks. The async uploads page is invoked directly, not through Next.js HTTP. Real SQL roles, access rules, immutable service fields, publication, pending-state protection, cleanup batching, favorites/history behavior and quota preservation have separate rollback-based coverage in `supabase/tests/database/model_management.test.sql`. The one-off actual-file SDK diagnostic is not a unit/E2E test. HTTP/cookies, RSC refresh rendering, real focus/keyboard flow and visual/mobile checks remain deferred to final browser QA.

## Model Download Server Action (`model-download-action.spec.ts`)

- [x] Authenticates the caller and validates profile/model/file data against the verified database shape
- [x] Rejects guests, insufficient plans, unpublished models, forged IDs, foreign paths, and unsupported buckets/providers before signing
- [x] Selects the primary source deterministically or scopes an explicit file ID to the requested model
- [x] Prepares a 60-second attachment URL before invoking the user-bound quota RPC
- [x] Encodes the original filename without overwriting the signed token
- [x] Rejects malformed, foreign-origin, or unexpected-path signing responses without recording quota
- [x] Does not call the quota RPC on signing failures, including the Storage `400` / `statusCode: "404"` missing-object response
- [x] Does not return the prepared URL on quota denial, RPC errors, or unrecognized statuses
- [x] Bounds the action to ten seconds for stalled Auth, profile/model/file reads, signing, and RPC; clears its timer on completion
- [x] Uses shared network/client-boundary mocks in `unit/mocks/model-download.ts`; no real network is used by this spec

The live Storage/RPC diagnostic is separate from these unit tests. Next.js cookies, HTTP Server Action handling, and Download buttons still need browser coverage at final MVP QA; the dev server remains stopped by the user's choice.

## Model Download UI (`model-download-button.spec.tsx`)

- [x] Starts the attachment only after action success and removes the temporary link
- [x] Invalidates the existing catalog/designer caches and refreshes server data without touching unrelated query data
- [x] Prevents duplicate pending requests and allows another attempt afterward
- [x] Passes explicit file IDs and labels compact controls with the actual filename
- [x] Shows every typed action error and rejected-action failures without downloading or refreshing
- [x] Renders real EN/UA messages using the actual toast UI and query client

## Public Model Files (`model-files.spec.tsx`)

- [x] Checks publication and model identity before scoped administrative access
- [x] Selects and returns only validated public summary fields, stripping unexpected private metadata
- [x] Uses stable ordering and a bounded file list; malformed, oversized and failed reads return a recoverable failure
- [x] Aborts slow metadata reads after ten seconds
- [x] Renders actual filenames, formats, localized sizes, primary flags and specific-file download controls
- [x] Separates empty and error states without fictional formats or raw database errors

The metadata reader and async `FilesTab` are invoked directly in these tests with controlled Supabase and Next.js runtime boundaries. This does not verify streaming, hydration or real browser file transfer.

## Profile Overview (`profile-overview.spec.tsx`)

- [x] Authenticates the current user and calls the parameterless statistics RPC with a bounded request
- [x] Validates the generated response contract, safe counts and profile identity; strips unexpected private fields
- [x] Separates a missing/expired session from service outages and missing profile data without fabricated defaults
- [x] Handles rejected requests and a shared ten-second deadline for client creation, Auth and RPC; clears timers
- [x] Preserves real Next.js control-flow errors rather than converting them to profile failures
- [x] Renders actual Free/Pro/Max plan labels, usage, remaining quota, published uploads and favorites
- [x] Supports zero usage, lowered/zero limits, UA number formatting, localized login redirects and invalid locales
- [x] Shows recoverable generic/timeout states and locale-aware library/retry links without fixed Free/zero placeholders

The async page is invoked directly with the real action, schemas, translation messages and shared UI. These tests do not validate Next.js HTTP cookies, browser retry navigation or visual layout; those remain for final MVP QA.

## Profile Library (`profile-library-action.spec.ts`, `profile-library.spec.tsx`)

- [x] Authenticates before calling the session-bound pagination RPC, validating the generated contract and public summaries
- [x] Normalizes invalid URL parameters, passes tab/page only and accepts the clamped last page
- [x] Rejects wrong-user, wrong-tab, malformed, duplicated, oversized and inconsistent count/page responses
- [x] Resolves cover/avatar paths and strips unexpected private fields from nested data
- [x] Separates guests, service failures, valid empty accounts and timeouts; preserves Next.js control-flow errors
- [x] Uses one ten-second deadline across client creation, Auth and RPC, clearing timers on completion
- [x] Renders full counts, real model/designer cards, locale-aware links and Ukrainian numbers
- [x] Navigates pages through the real pagination component, preserves URL state and resets the page on tab change
- [x] Restores active section/page from changed server props and supports keyboard tab activation
- [x] Renders distinct empty/error/timeout states and localized retry links without fabricated counts

These specs use shared Supabase/Next boundary fixtures in `unit/mocks/profile-library.ts`, real React Query/providers, schemas, translations and shared UI. They do not verify actual browser history, HTTP cookies, navigation pending timing or visual layout. Favorite/follow synchronization has separate unit coverage below; its real app flows remain for final MVP QA. Database grouping, isolation and stable pagination have separate real-role coverage in `supabase/tests/database/profile_library_pagination.test.sql`.

## Favorites And Follows

### Queries (`favorites-queries.spec.ts`)

- [x] Validates real UUID/row contracts and checks live ownership before private reads/writes
- [x] Separates guests, service outages, stale identities, missing targets and invalid requests without exposing raw errors
- [x] Reads more than 1000 IDs through ordered bounded batches, including short nonempty server pages
- [x] Rejects invalid/duplicate/backward IDs, oversized responses and later-page failures rather than partial lists
- [x] Uses owner-scoped idempotent adds/removes and blocks self-follow
- [x] Supports cancellation, shared ten-second Auth/read/write deadlines, late Auth responses and timer cleanup

### Controls (`favorite-buttons.spec.tsx`)

- [x] Hides confirmed guests/self-follow and renders actual saved states
- [x] Adds/removes favorites and follows, refreshes server data and preserves unrelated caches
- [x] Prevents duplicate writes across two cards and waits for confirmation before changing selection
- [x] Renders real UA/EN toast failures, safe timeout copy and recoverable read-error controls
- [x] Rechecks identity before writes and when retrying stale-owner reads
- [x] Prevents parent card navigation for save and retry clicks

### Session Synchronization (`favorites-session.spec.tsx`)

- [x] Registers one listener in the real QueryProvider and unsubscribes on unmount
- [x] Clears/cancels previous users' private data while preserving public catalog queries
- [x] Handles sign-out and ignores same-user token events without repeated refreshes
- [x] Rejects late Auth/list/mutation results from a previous account
- [x] Re-reads actual state after switching away and back instead of applying an old click
- [x] Revalidates server-action login/logout on pathname changes without a browser auth event
- [x] Keeps SDK Auth calls outside the auth-state callback

Shared SDK/router recorders and deterministic fixtures live in `unit/mocks/favorites.ts`. These specs use the real QueryClient, providers, React, schemas, messages, buttons and toast UI, not mocks of those libraries. Browser cookies, real cross-tab delivery, RSC refresh rendering and full library flows still require final MVP QA. The local SQL rollback diagnostic for INSERT ON CONFLICT DO NOTHING/repeated DELETE is separate, not an additional CI test.

## Marketplace Plan Constants

- [x] Plan keys stay aligned with the product tiers: `free`, `pro`, `max`
- [x] Plan badge color maps cover every known plan key

## Coverage Map

| Area                        | Source                                                                          | Spec                               | Status        |
| --------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- | ------------- |
| Shared hook                 | `src/shared/hooks/use-mobile.ts`                                                | `use-mobile.spec.ts`               | `[x] Covered` |
| Catalog UI shell            | `src/app/[locale]/(main-pages)/catalog/components/CatalogShell`                 | `catalog-shell.spec.tsx`           | `[x] Covered` |
| Designers actions           | `src/app/[locale]/(main-pages)/designers/actions.ts`                            | `designers-action.spec.ts`         | `[x] Covered` |
| Designers UI shell          | `src/app/[locale]/(main-pages)/designers/components/DesignersShell`             | `designers-shell.spec.tsx`         | `[x] Covered` |
| Featured models copy        | `messages/ua.json`                                                              | `featured-models-copy.spec.ts`     | `[x] Covered` |
| Featured model card         | `src/business/components/FeaturedModelCard`                                     | `featured-model-card.spec.tsx`     | `[x] Covered` |
| Model detail UI             | `src/app/[locale]/(main-pages)/catalog/[slug]/components`                       | `model-detail-components.spec.tsx` | `[x] Covered` |
| Designer seed data          | `scripts/post-seed-designers.mjs`                                               | `designer-seed.spec.ts`            | `[x] Covered` |
| Main pages layout           | `src/app/[locale]/(main-pages)/layout.tsx`                                      | `main-pages-layout.spec.tsx`       | `[x] Covered` |
| Models pagination           | `src/business/components/ModelsPagination`                                      | `models-pagination.spec.tsx`       | `[x] Covered` |
| Plan constants              | `src/business/constants/plans.ts`                                               | `plan-constants.spec.ts`           | `[x] Covered` |
| Model upload helpers        | `src/business/utils/modelUpload.ts`                                             | `model-upload-utils.spec.ts`       | `[x] Covered` |
| Model upload schema         | `src/business/schemas/modelUpload.ts`                                           | `model-upload-schema.spec.ts`      | `[x] Covered` |
| Model upload action         | `src/app/[locale]/(main-pages)/profile/uploads/actions.ts`                      | `model-upload-action.spec.ts`      | `[x] Covered` |
| Model management actions    | `src/app/[locale]/(main-pages)/profile/uploads/management-actions.ts`           | `model-management-action.spec.ts`  | `[x] Covered` |
| Model management boundaries | `src/business/schemas/modelManagement.ts` and `utils/modelManagement.ts`        | `model-management-utils.spec.ts`   | `[x] Covered` |
| Model management UI         | `src/business/hooks/useModelManagement.ts` and uploads controls                 | `model-management-ui.spec.tsx`     | `[x] Covered` |
| Profile uploads page        | `src/app/[locale]/(main-pages)/profile/uploads/page.tsx`                        | `profile-uploads.spec.tsx`         | `[x] Covered` |
| Model download action       | `src/app/[locale]/(main-pages)/catalog/download-actions.ts`                     | `model-download-action.spec.ts`    | `[x] Covered` |
| Model download UI           | `src/business/components/DownloadModelButton`                                   | `model-download-button.spec.tsx`   | `[x] Covered` |
| Public model files          | `src/business/utils/supabase/modelFiles.ts` and model-detail `FilesTab`         | `model-files.spec.tsx`             | `[x] Covered` |
| Profile settings form       | `src/app/[locale]/(main-pages)/profile/settings/components/ProfileSettingsForm` | `profile-settings-form.spec.tsx`   | `[x] Covered` |
| Profile overview            | `src/app/[locale]/(main-pages)/profile/actions.ts` and `page.tsx`               | `profile-overview.spec.tsx`        | `[x] Covered` |
| Profile library action      | `src/app/[locale]/(main-pages)/profile/library/actions.ts`                      | `profile-library-action.spec.ts`   | `[x] Covered` |
| Profile library UI/page     | `src/app/[locale]/(main-pages)/profile/library`                                 | `profile-library.spec.tsx`         | `[x] Covered` |
| Favorite/follow queries     | `src/business/queries/favorites.ts`                                             | `favorites-queries.spec.ts`        | `[x] Covered` |
| Favorite/follow controls    | `src/business/hooks/useFavorites.ts` and shared buttons                         | `favorite-buttons.spec.tsx`        | `[x] Covered` |
| Favorite session sync       | `src/business/hooks/useFavoritesSession.ts` and `QueryProvider`                 | `favorites-session.spec.tsx`       | `[x] Covered` |

## Known Gaps

- [ ] No shared utility coverage yet
- [ ] Most async server components should remain primarily in e2e coverage

## Authoring Notes

- Prefer public behavior over implementation details.
- Keep reusable mocks in `unit/mocks` instead of redefining them inside each spec.
- Mock app/runtime boundaries only when the real dependency cannot run deterministically in jsdom, such as Supabase clients, Next runtime hooks, or missing browser APIs.
- Do not mock Vitest, React Testing Library, React, or browser/library behavior that jsdom can exercise directly; use the real implementation instead.
- Use `unit/fixtures` as the single import surface for shared Vitest and Testing Library helpers.
- Keep this file updated whenever a new spec is added, removed, or broadened.
