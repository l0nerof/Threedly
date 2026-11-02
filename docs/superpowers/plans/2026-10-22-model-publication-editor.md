# Model Publication Editor

## Agreed Product Direction

The creator experience is a publication editor, not a settings form or a mandatory step-by-step wizard. The user selected the first displayed design concept on 22 October 2026: a large single cover on the left, editable model content on the right, a source-file row below, and a persistent save/publish action bar.

The selected reference is the first ImageGen result, `exec-7e88c419-9624-4100-843e-a052932b9459.png`, in the current conversation. Its generated sofa is illustrative user content, not a required production asset. Reuse Threedly's existing tokens, typography, icons, authentication shell, UA/EN routing and shared controls; do not reproduce the mock's guest login controls inside an authenticated editor.

Agreed behavior:

- Start from My Models and open a dedicated publication editor.
- Save incomplete drafts explicitly; there is no autosave.
- Make Save Draft available when content changes. Keep Publish available for a complete saved draft even when nothing else has changed.
- Preserve saved work across devices through server-side persistence, not browser-only storage.
- Keep exactly one cover image. An interactive 3D viewer is future work, not part of this redesign.
- Preview the future public model detail page, not just its catalog card. Previewing unsaved edits does not persist them.
- Validate complete publication data separately from partial draft content.
- Preserve existing published-model management until its replacement is separately agreed.
- Leave the existing disabled public Preview buttons and pricing/payment copy unchanged, as explicitly requested. Billing remains outside the closed free beta.

## Why Separate Draft Records

`models` requires a category, bilingual titles, slug and cover path. Its current upload INSERT policies require immediate publication. Weakening those contracts, inventing placeholder categories/covers, or treating browser storage as cross-device persistence would undermine existing behavior.

Use a separate `model_publication_drafts` table for unfinished content. Keep the existing `models.status = draft` value and old management flow unchanged. The two concepts are not interchangeable: a publication draft does not yet represent a catalog model or a downloadable asset.

## Approved Stage 1: Metadata Persistence Only

- [x] Add `public.model_publication_drafts` with generated ID/owner/timestamps, partial UA/EN titles/descriptions, optional category and minimum access plan.
- [x] Apply owner-scoped RLS and explicit column-level grants. Only accounts with current `profiles.can_upload` may create drafts. Owners may read and edit their existing text after permission revocation, matching existing metadata-management behavior.
- [x] Keep IDs, ownership and timestamps server-controlled. A private security-invoker trigger updates `updated_at` with `statement_timestamp()`; it has no direct application-role execution grants.
- [x] Enforce 90-character title and 600-character description bounds, valid existing categories and the existing plan enum. Empty and one-character titles are valid draft content, not publication-ready content.
- [x] Add creator/update/ID ordering and category foreign-key indexes.
- [x] Verify with deterministic, rollback-only pgTAP tests using actual roles; apply the migration only locally without resetting data.
- [x] Regenerate/verify the local public-schema types and update the data/development/MVP documentation.

Stage 1 adds no server actions, routes, UI, file paths, Storage buckets/policies, deletion/publication operation, billing logic or new dependency. The existing upload still publishes immediately until a later approved stage switches the UI. Do not claim the user can already save a draft from the app.

The new table is accessed through the session-bound Data API with RLS, not a privileged RPC/admin client. Future callers must validate their inputs and response schemas, filter by owner/ID, paginate lists, bound waits, and handle failures explicitly. Generated TypeScript table shapes do not encode column privileges: never send generated ID/owner/timestamps in user writes.

## Approved Stage 2: Private Assets And Publication

The user approved the backend/file-transfer stage on 22 October. Keep the UI and existing upload unchanged until the next stage. Use the existing SDK, not a new resumable-upload dependency; interrupted uploads restart from the beginning.

- Private model-draft-files (50 MiB, source) and model-draft-images (5 MiB, JPEG/PNG/WEBP, one active cover) buckets.
- Register immutable per-asset paths before authenticated browser-to-Storage uploads. No administrative key or 50 MiB request body goes through a server action.
- Save metadata and attach completed assets through a caller-scoped RPC with revision checks. Replacing an asset retires the old object only after its replacement is attached. There is no autosave.
- Freeze a complete draft and reserve one publication model ID. Copy to canonical existing models / model-images paths, then create the public model and primary file in one database transaction. Retry the frozen publication, never allocate another model on a timeout.
- A public candidate cover can become accessible after publication begins, even if finalization later fails. Public URLs/cache cannot be made private by hiding a database row.
- Retain cleanup/cancellation state and reservations across uncertain outcomes. Retired assets are removed through Storage API, never SQL deletes. Expired/cancelled uploads retain tombstones until their admission window expires; cleanup is explicitly retryable, not a background orphan-removal guarantee.
- Protect active private files and frozen publication destinations from user deletion. Reject stale edits rather than overwrite another device's save. Allow metadata reading, cancellation and cleanup after creator permission is revoked.
- Test SQL roles, boundary validation, transfers, failures, duplicate publication and real local Storage bytes. No production changes, reset, dev server or browser/E2E run.

Approved additions/updates: CLI migration 20261022171015_model_publication_assets.sql; model_publication_assets.test.sql; existing draft SQL tests/types; new modelPublication constants/schema/types/utils; browser upload helper; server-only Storage helper; uploads draft-actions.ts / publication-actions.ts; reusable unit boundary mocks and four publication unit specs; this plan, data/development/MVP docs and unit coverage README. These correspond to the 22-file list approved in chat.

### Stage 2 Completed Locally

- [x] Applied `20261022171015_model_publication_assets.sql` locally, without reset or production changes.
- [x] Added private source/cover buckets, immutable upload reservations, revision-checked saves/attachments, minimal private readers and bounded owner lists.
- [x] Implemented direct authenticated SDK uploads, safe replacement, idempotent prepare/copy/finalize publication and explicitly retryable cancellation/deletion/cleanup.
- [x] Kept the current UI/upload unchanged. The future editor will call these actions; no draft button or page preview is connected yet.
- [x] Verified actual public-schema generation by TypeScript AST comparison, preserving existing generated-file changes.
- [x] Added four unit specs plus shared boundary mocks: 77 new tests; full unit suite 575/575 in 40 files.
- [x] Full pgTAP suite: 439/439 in eight files, including 103 new publication-asset checks. The initial migration was exercised in rollback before local application; verification fixes for administrative schema usage and the approved final guard were also applied locally from this working migration.
- [x] Typecheck, lint (no errors; seven pre-existing warnings), production build and local security advisors passed.
- [x] One-off real local SDK diagnostic passed 50 checks against the actual actions/helpers, replacing only Next cookie/cache and browser-client construction boundaries. It exercised real Auth sessions, OBJ/PNG uploads, private signed cover bytes, replacement, foreign denial, partial copy, duplicate publication, download RPC compatibility, revocation, cancellation and cleanup. Created files, metadata and two accounts were removed. This is not HTTP/cookie or browser verification, nor a registered CI test.
- [x] Two separately synchronized SQL transaction barriers passed six concurrency assertions: actual privileged final INSERTs block cancellation/deletion until commit, and committed metadata remains discoverable for cleanup. Metadata-only fixtures were removed; no file bytes were created for these probes. This one-off diagnostic is not part of CI.

#### Cancellation Safety And Managed Storage Guard

A private `model_publication_destinations` ledger keeps closed publication IDs and canonical paths even after draft deletion. Cancelling closes its candidate destinations; cleanup does not reopen them. A new explicit publication after cancellation receives a new ID; an ordinary retry while publishing/published retains its original ID. Ledger records remain until the owning profile is removed; they are not a public API or a background-cleanup service.

Storage v1.82.1 performs rolled-back permission probes and later writes with privileged access. Locks acquired only in a probe do not survive its rollback. The user separately approved the narrow `storage.objects` BEFORE INSERT guard to recheck the actual final write. It affects only the two draft buckets and IDs in our publication ledger, preserving legacy uploads. Normal writes use `auth.uid()`; trusted internal writes without it resolve the registered owner from Storage owner metadata. The private actor-aware checker is not directly executable by application roles. The guard locks profile before draft/asset or destination, and requires a live upload grant and allowed immutable destination. Application code still writes/deletes files exclusively through Storage API, never raw Storage SQL.

This is a custom trigger on a managed table: repeat privileged-insert, upload/copy and concurrency verification after Storage upgrades and during production migration rehearsal. Versioned upstream implementation: [copy/final write](https://github.com/supabase/storage/blob/v1.82.1/src/storage/object.ts), [permission probes](https://github.com/supabase/storage/blob/v1.82.1/src/storage/database/pg.ts).

Private reservations expire after 15 minutes. A released/deleting, unexpired reservation can still yield `cleanup_incomplete`; preserve its retry state and try again after expiry. No five-minute publication cleanup assumption remains. API failures/timeouts can have uncertain outcomes: reread the draft before making a new editing intent, retry a frozen publication with the same draft ID, and explicitly call cleanup after successful replacement/publication. Neither attachment nor publication implicitly claims all retired originals are already removed.

#### Local Docker Recovery And Additional Approval

Docker recovered after the user restarted it, but Windows reserved 55235–55334, including all old 5532x ports. Project-scoped stop/start preserved the database/storage volumes. With separate user approval, `supabase/config.toml` and `README.md` were added to this stage: API 54321, Postgres 54322, Studio 54323, mail 54324, shadow DB 54320, optional pooler 54329, analytics 54328 (54327 also failed to bind). Current docs use these addresses; historical verification records retain their original ports. Windows reservations and remote credentials were not changed.

The installed CLI downloaded its current runtime images on standard restart (Postgres 17.11.0.004, Storage v1.82.1). After restart and all diagnostics, existing counts remained 16 profiles / 49 models / zero Storage objects; all temporary publication records were cleaned. There are now 14 applied local migrations. No data reset, global Docker restart, unrelated-project change, Git write or production migration occurred. The vector logging container still restarts as it did before recovery; core DB/Auth/API/Storage are healthy and the tested application operations do not depend on that log collector.

## Approved Stage 3: Editor UI — Connected Locally On 25 October

The user approved the 24-file UI plan, with public-page preview explicitly deferred to the next step, and separately approved updating the existing publication SDK mock (25 files total). No dependency, schema, migration, global style or published-model-management change was added.

- [x] Replace the mounted legacy form with a private draft list and create entry; preserve the existing model list/controls.
- [x] Add localized private new/draftId editor routes using the selected first mock, the existing profile shell/tokens, one cover and no 3D-preview input.
- [x] Keep edits/file selections local until explicit Save/Publish. Persist partial drafts, acknowledged metadata and sequential direct SDK transfers with stable create identity/latest revision.
- [x] Wire publish/frozen retry, cancel/delete confirmations, cleanup retry, saved-version reconciliation, account isolation and bounded client waits.
- [x] Keep complete unchanged drafts publishable; do not invent success after partial failure. Keep confirmed text/files and pending local values independently.
- [x] Add three editor specs (46 checks), extend the existing draft-action list boundary and adapt uploads-page coverage. Full unit suite 622/622 in 43 files; DB regression 439/439.
- [x] Typecheck, lint (zero errors, seven pre-existing warnings), build and scoped formatting pass. No dev server/browser/E2E, production, Git or data reset.

The UI uses manual RHF/Zod state and real shared controls, not a screenshot or a new design system. The mock sofa represents user content and was not added as a production asset. Private covers bypass the public Next image optimizer and support signed-link refresh. All new navigation remains locale-aware and private routes are noindex.

Known verification boundary: beforeunload plus the editor's own Back confirmation are implemented, not a universal sidebar/header/browser-history navigation blocker. Decide/verify that coverage during final browser QA; no undocumented router or history interception is introduced. Pixel fidelity, responsive layout, real keyboard/focus, HTTP cookies, file bytes and RSC navigation are not claimed verified. Image-to-Code's browser/design QA is deferred by the user's explicit no-dev/no-browser instruction; no passed visual-QA artifact was fabricated. Existing E2E/POM upload-form expectations must be updated at that stage.

Approved files:

- `src/app/[locale]/(main-pages)/profile/uploads/page.tsx`
- `src/app/[locale]/(main-pages)/profile/uploads/new/page.tsx`
- `src/app/[locale]/(main-pages)/profile/uploads/[draftId]/page.tsx`
- `src/app/[locale]/(main-pages)/profile/uploads/components/PublicationEditor/index.tsx`
- `src/app/[locale]/(main-pages)/profile/uploads/components/PublicationEditor/PublicationContent.tsx`
- `src/app/[locale]/(main-pages)/profile/uploads/components/PublicationEditor/PublicationActions.tsx`
- `src/app/[locale]/(main-pages)/profile/uploads/components/PublicationDrafts/index.tsx`
- `src/business/hooks/usePublicationEditor.ts`
- `src/business/utils/modelPublicationEditor.ts`
- `src/business/types/modelPublicationEditor.ts`
- `src/business/constants/modelPublicationEditor.ts`
- `src/app/[locale]/(main-pages)/profile/uploads/draft-actions.ts`
- `messages/ua.json`
- `messages/en.json`
- `unit/mocks/model-publication-editor.ts`
- `unit/tests/model-publication-editor.spec.tsx`
- `unit/tests/model-publication-editor-utils.spec.ts`
- `unit/tests/model-publication-editor-pages.spec.tsx`
- `unit/tests/profile-uploads.spec.tsx`
- `unit/tests/model-publication-actions.spec.ts`
- `unit/README.md`
- `docs/development-guide.md`
- `docs/mvp-status.md`
- `docs/superpowers/plans/2026-10-22-model-publication-editor.md`
- `unit/mocks/model-publication.ts`

## Approved Stage 4: Public-Page Preview — Connected Locally On 25 October

The user approved the exact 23-file plan for a fullscreen preview in the existing editor, with no save/upload/publication and no public draft route. No additional files, dependency, schema, migration or production change is required.

- [x] Extract pure hero, overview and file-list presentation; retain public server fetching, optimized images, designer links, statistics and actual Download behavior.
- [x] Snapshot current unsaved metadata and selected files on open; support UA/EN model content and preserve the mounted editor on close/reopen. Interface labels retain the current editor locale.
- [x] Show actual selected/saved cover and source summaries, incomplete-content placeholders and disabled preview navigation/downloads, without fake model IDs/slugs, publication dates or statistics.
- [x] Read only the authenticated owner's actual public profile fields with schema validation and the existing server deadline. No admin key, write, upload permission escalation or revalidation is involved.
- [x] Refresh saved private covers through the existing reader, validating the same snapshot asset/canonical signed URL, without loading another device's text or replacement image into local state.
- [x] Clean independent local blob URLs, cancel waits, reject late/session-changed results and offer separate author/image retries. Existing Sheet focus trap/Escape/trigger restoration is reused, not hand-built.
- [x] Add 42 checks in three preview specs, extend the shared SDK fixture and retain public CTA regression assertions. Full unit suite 664/664 in 46 files; typecheck/build/scoped formatting pass, lint zero errors/seven existing warnings, local Security Advisor no issues.

No dev server/browser/E2E was started. jsdom focus/cancellation tests are not real browser, HTTP/cookie, responsive or pixel verification. The unchanged DB suite was not rerun in this read-only/presentation stage; its last result remains 439/439. React review kept shared presentation free of fetches, components outside render functions and the public author DTO minimal. Public disabled Preview buttons, pricing, billing, existing model management, dependencies, Git and production remain untouched.

Approved files:

- `src/business/components/ModelDetailHero/index.tsx`
- `src/business/components/ModelDetailOverview/index.tsx`
- `src/business/components/ModelFileList/index.tsx`
- `src/app/[locale]/(main-pages)/catalog/[slug]/components/ModelHero/index.tsx`
- `src/app/[locale]/(main-pages)/catalog/[slug]/components/OverviewTab/index.tsx`
- `src/app/[locale]/(main-pages)/catalog/[slug]/components/FilesTab/index.tsx`
- `src/app/[locale]/(main-pages)/profile/uploads/components/PublicationEditor/index.tsx`
- `src/app/[locale]/(main-pages)/profile/uploads/components/PublicationPreview/index.tsx`
- `src/app/[locale]/(main-pages)/profile/uploads/preview-actions.ts`
- `src/business/utils/modelPublicationPreview.ts`
- `src/business/types/modelPublicationPreview.ts`
- `messages/ua.json`
- `messages/en.json`
- `unit/tests/model-publication-preview.spec.tsx`
- `unit/tests/model-publication-preview-action.spec.ts`
- `unit/tests/model-publication-preview-utils.spec.ts`
- `unit/tests/model-detail-components.spec.tsx`
- `unit/tests/model-files.spec.tsx`
- `unit/mocks/model-publication-editor.ts`
- `unit/README.md`
- `docs/development-guide.md`
- `docs/mvp-status.md`
- `docs/superpowers/plans/2026-10-22-model-publication-editor.md`

## Approved Stage 5: Editor UX Follow-Up — 2 November 2026

The user approved six editor fixes and the exact accompanying documentation scope: `unit/README.md`, `e2e/README.md`, `docs/mvp-status.md` and this plan. This follow-up does not change dependencies, database schema/migrations or production.

- [x] Replace category selection with the shared Base UI Combobox: search localized category/group names, retain visible group context, support empty results and provide localized trigger/clear labels.
- [x] Give editor Input/Textarea controls visible internal padding using the shared primitives.
- [x] Place the preview return action on the left before the heading, retaining the shared dialog's focus/close behavior.
- [x] Add confirmed deletion to draft-list rows through the existing server action, preventing duplicate writes and preserving retry/recheck/conflict/session handling. Normalize the last empty draft page without disturbing published-model pagination.
- [x] Distinguish the completed publication with its own heading and My models / Create another links. Keep cleanup feedback separate: derive `cleanupPending` read-only from the published owner's remaining asset rows, validate the count, recheck after cleanup and retain the warning across reload. No stored flag or migration is needed.
- [x] Explain readiness with native progress and exactly five required items: valid UA title, valid EN title, known category, source and cover. Use the same `publicationReadiness` helper for Publish eligibility; mark descriptions optional while retaining their maximum length and the full metadata validation contract.

### Registered Coverage

Editor/utils assertions cover local zero-to-five progress, undo, category/group search, no results/clear, title/category/file boundaries, empty/oversized optional descriptions and persisted cleanup-response validation. They also cover a clean published state after reload in both locales, failed cleanup retaining success/retry, delayed server confirmation and a successful cleanup RPC that still leaves temporary records. Route/list assertions cover cancellation, confirmed deletion, pending duplicates, partial cleanup, conflict rereads and reconfirmation, failed rechecks, changed accounts/session revisions and last-page normalization. Action assertions derive cleanup from actual published asset counts (including counts larger than one batch), reject malformed/failed counts and foreign drafts, expose no Storage paths and perform no write during the read. Preview assertions check return-before-heading order and focus restoration in both interface locales.

`publication.spec.ts` additionally verifies real-browser category/group search, keyboard selection, Escape/focus and clearing; readiness without optional descriptions; desktop/mobile computed padding and preview-return geometry; confirmed draft-list deletion that remains deleted after reload; and distinct published success/navigation through reload without draft hints/progress. Category-search regression coverage immediately closes an empty popup with Escape, reopens it and verifies filtering against the new external query. These use the existing local-write opt-in and actual app/Auth/Storage stack. Desktop/mobile readiness and preview plus published-success scenarios produce screenshots; their inspected scope is recorded below.

### Final Verification — 2 November 2026

**735/735 unit tests in 49 files** passed, 42 checks above the previous baseline. Typecheck passed again after the E2E helper adjustments; lint reported zero errors and seven pre-existing warnings; the Next.js 16.4.3 production build and scoped Prettier check across 26 files passed. Targeted real-local Chromium passed **7/7**; the final full run passed **95/95**, with **zero unexpected, zero flaky and zero skipped**, in 8.7 minutes. Five layouts were visually inspected: desktop readiness/preview return, mobile editor readiness/preview and published success; the final run's readiness and success captures were inspected again. Broader manual/theme/cross-browser review remains. Final read-only cleanup verification matched the pre-run baseline: **16 profiles, 50 models, 16 Auth users and two Storage objects**, with zero unfinished drafts, isolated test accounts/profiles/models and draft-bucket objects. Full-run artifacts, earlier premature URL assertions and the condition-based operation/navigation waits are documented in `e2e/README.md`. Earlier stage results and restrictions retain their original dates. Production remains untouched.

## Later Stages — Separate Approval Required

1. Complete broader manual, theme and cross-browser review during final MVP QA. The local Chromium checks for UA/EN, keyboard, desktop/mobile viewports, preview and upload flows are recorded above. Keep public disabled Preview buttons unchanged.
2. Prepare the separately approved production transition using `docs/release-readiness.md` and the 28 October local migration-rehearsal evidence.

Publication must revalidate all required data and live upload access. Files and metadata cannot share a single database transaction, so publication must account for partial failures instead of assuming a file upload and a row write always succeed together. The exact attachment/publication contracts are not implemented by Stage 1.

## Stage 1 Approved Files

- This plan.
- `supabase/migrations/20261022155024_model_publication_drafts.sql` (name generated by the CLI).
- `supabase/tests/database/model_publication_drafts.test.sql`.
- `src/business/types/database.generated.ts`.
- `docs/data-model.md`.
- `docs/development-guide.md`.
- `docs/mvp-status.md`.

## Stage 1 Verification

- [x] `npm run test:db` — 336 checks in seven files, including 54 new checks.
- [x] `npm run typecheck` — passed.
- [x] `npm run lint` — no errors; seven pre-existing warnings outside the approved files.
- [x] `npm run test:unit` — 498 checks in 36 files. The sandbox blocked a required child process (`spawn EPERM`); the permitted rerun passed.
- [x] Local security advisors — no issues. The saved public-schema TypeScript AST matches actual CLI generation; only the new table block was added, preserving existing edits.

Do not start the dev server or E2E suite for this backend/file-transfer stage. Do not change production, reset data or perform Git writes.
