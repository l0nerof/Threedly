# Development Guide

## Stack

- `Next.js 16` App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `shadcn/ui`
- `Supabase`
- `next-intl`
- `motion`
- `gsap`
- `three`
- `zod`

## Commands

```bash
npm install
npm run dev
npm run dev:remote
npm run db:start
npm run db:reset
npm run db:seed
npm run db:types
npm run build
npm run start
npm run e2e:install
npm run e2e
npm run e2e:headed
npm run e2e:ui
npm run test:unit
npm run test:db
npm run test:unit:watch
npm run lint
npm run typecheck
npm run format
```

## Environment

Expected public environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

The download server action additionally requires `SUPABASE_SERVICE_ROLE_KEY` in the server environment. It is an administrative credential that bypasses RLS: never prefix it with `NEXT_PUBLIC_`, pass it to client components, or print it in logs. The `server-only` helper in `src/business/utils/supabase/admin.ts` validates configuration and uses it only for scoped file metadata reads and URL signing in the application; quota recording still uses the caller's session.

Recommended workflow:

- keep the real Supabase project credentials in `.env.local`
- use `npm run dev` for local frontend + local Supabase
- use `npm run dev:remote` when you want the frontend to talk to the real Supabase project
- use `npm run db:start`, `npm run db:reset`, and `npm run db:seed` only for the local Supabase stack
- use `npm run db:start` to boot local Supabase containers before `npm run db:seed`
- use `npm run db:types` after schema migrations so TypeScript stays aligned with the local database shape

How local mode works:

- `npm run dev` starts local Supabase if needed and ensures the local demo user exists
- the wrapper injects the local URL, publishable key, and server-only service-role key directly into the `next dev` process
- `.env.local` is not rewritten during local startup
- Supabase Studio is available at `http://127.0.0.1:54323`; local API/Postgres use 54321/54322. Windows reserved the former 5532x range, so local ports were moved with user approval. Analytics uses 54328 because 54327 is also unavailable. Remote credentials are unchanged.
- local demo user credentials are written to `.env.demo-user.local` and kept in sync with the local auth seed
- `.env.remote.local` and `.env.supabase.local` are no longer part of the workflow
- local browser/E2E checks are now authorized for final MVP QA. The wrapper supplies the administrative key in local mode; do not combine a local URL with a remote key
- `npm run dev:remote` keeps using the server environment / `.env.local`; configure its administrative key manually only when preparing that environment, never by copying local credentials into production

Local DB command behavior:

- `npm run db:start` starts the local Supabase stack and syncs the demo auth user
- `npm run db:reset` removes local Supabase containers and data volumes, starts a fresh stack, reapplies migrations and SQL seeds, then runs the demo-user post-seed
- `npm run db:seed` reapplies SQL seeds and demo-user post-seed against an already running local stack
- `npm run db:seed` should fail fast if local Supabase is not running instead of starting Docker automatically
- `npm run db:types` regenerates `src/business/types/database.generated.ts` from the running local Supabase schema

### Isolated legacy-schema upgrade rehearsal

To rehearse the existing hosted schema's transition without changing hosted data or resetting the main local stack:

```powershell
node scripts/rehearse-legacy-upgrade.mjs
```

Dependencies and a running Docker engine are required; the dev server is not. This command accepts no flags and has no remote mode. It creates only its own `threedly-rehearsal` Supabase stack on allocated free ports, with synthetic Auth/profile data and an actual avatar. It refuses existing rehearsal containers/volumes or a concurrent run, checks the legacy backup/restore and rollback, compares the initial schema with an independently migrated reference before commit, applies the 14 unchanged repository migrations locally and runs the existing pgTAP suite. If the main local stack is running, its aggregate row counts are compared before/after; it is never reset or stopped.

Reports, synthetic SQL archives/avatar bytes, schema snapshots and logs remain under git-ignored `test-results/legacy-rehearsal/<timestamp>/`. Normal success/failure removes only the created temporary stack and lock. A forcibly killed process can leave resources: inspect its PID, report and exact resource names before cleaning up that run. Never use a global Docker cleanup or the main `db:reset` workflow for this.

The generated `review-bootstrap.sql` is for local review, not direct production execution. Local and hosted service versions differ; the backup restore is within the temporary cluster rather than a complete hosted restore. See [release readiness](release-readiness.md) for verified versions, limitations, hosted Auth/SMTP/env checks and the separately approved production transition still required.

### Local email verification and password recovery

Email confirmation is enabled locally. A real signup sends a six-digit code using `supabase/templates/confirmation.html`; enter it on the application's verification page. Existing seeded demo and isolated admin-created test accounts are explicitly confirmed, so their normal login does not require a new code.

Mailpit captures local Auth mail at `http://127.0.0.1:54324`. The container retains the historical `supabase_inbucket_threedly` name, but its API is Mailpit v1. Local settings allow both UA/EN verification and password-reset destinations on localhost/127.0.0.1. The local email allowance is 100 per hour for repeated tests; OTPs remain six digits with a one-hour expiry. Resend uses a 60-second deadline, recalculates on focus/visibility and starts a new deadline only after a successful resend; delayed browser callbacks do not extend it.

After changing Auth configuration or the email template, restart this local stack while retaining its data:

```powershell
npx --no-install supabase stop --project-id threedly
npx --no-install supabase start
```

The normal stop command backs up local data. The destructive `db:reset` workflow is not needed for email settings. The QA restart preserved 16 Auth users, 16 profiles, 49 models and all three custom Storage triggers. Hosted Auth configuration, production redirect URLs, email templates and external delivery require separate release verification; applying SQL migrations does not demonstrate those flows.

Email E2E tests use `THREEDLY_E2E_LOCAL_MUTATIONS=1` and the existing local web-server command documented in `e2e/README.md`. The fixture verifies local API/Mailpit URLs, reserves a test-only address, reads actual received mail and removes only newly created accounts/messages. The service-role key stays in Node; it is not sent to the browser. OTP replacement explicitly clears the real input before entering the next value so the test waits for the control's disabled/enabled state rather than racing a previous value.

The Supabase environment values are used by:

- `src/business/utils/supabase/client.ts`
- `src/business/utils/supabase/server.ts`
- `src/business/utils/supabase/proxy.ts`
- `src/business/utils/supabase/storage.ts`

## Routing And Localization

- Localization is configured through `next-intl`.
- Supported locales are `ua` and `en`.
- Default locale is `ua`.
- Locale-aware navigation wrappers live in `src/i18n/routing.ts`.
- The request/session proxy is implemented in `src/proxy.ts`.

## Architectural Conventions

### `src/app`

Use for:

- route files
- layouts
- metadata
- server actions closely tied to route flows
- route-group composition

### `src/business`

Use for:

- product-aware components
- business constants
- schemas and domain-specific typing
- providers
- Supabase utilities
- product logic that is not generic UI

### `src/shared`

Use for:

- reusable UI primitives
- generic hooks
- generic utilities
- cross-cutting types

## UI Direction

This is not meant to become a generic SaaS interface. When building new screens:

- prioritize premium visual design;
- preserve good spacing and hierarchy;
- use animation intentionally;
- prefer elegant typography and composition over dashboard boilerplate;
- keep the experience strong on both desktop and mobile.

The current visual system already uses:

- CSS variables in `src/app/[locale]/globals.css`
- custom animated/visual components in `src/shared/components`
- theme support via `next-themes`

## Forms And Validation

Existing forms use:

- `react-hook-form`
- `zod`
- server actions for auth/profile flows

When extending forms, keep validation logic explicit and colocated with the relevant business flow.

## Supabase Notes

Current observed usage:

- auth sign in and sign up
- username availability RPC: `is_username_available`
- profile/avatar storage

Current MVP storage strategy for marketplace assets:

- source model files and optional lightweight 3D previews use the private `models` bucket;
- catalog cover images use the public `model-images` bucket;
- downloadable source files are tracked through `model_files`;
- the optional viewer-ready asset is tracked through `models.preview_model_path`.

Avoid hard-coding assumptions beyond this MVP shape unless that work is explicitly being implemented.

### Database Access And Security Tests

- Apply pending migrations only to the local stack with `npx supabase migration up --local`; do not reset existing data to apply an incremental migration.
- `profiles` allows authenticated owners to update only `username`, `bio`, and `avatar_path`. Profile creation belongs to the auth signup trigger.
- Plan and quota fields, `can_upload`, IDs, and timestamps cannot be written through the user API. Administrative access retains the existing ability to manage them.
- Categories and category groups are publicly readable; writes require administrative access.
- Auth trigger functions cannot be executed directly by `anon` or `authenticated`. `is_username_available` remains available to both roles and runs with the caller's permissions.
- Run `npm run test:db` against a running local Supabase stack. It uses the CLI's built-in pgTAP runner; no additional npm test dependency is required.
- Tests live under `supabase/tests/database/`, use real database roles and deterministic fixtures, and roll back their changes. Coverage includes signup defaults, profile edits, denied plan/quota changes, category access, and manual beta plan assignment.
- Check local database security with `npx supabase db advisors --local --type security`.

For a beta plan assignment, use an administrative SQL session (for example, the local Studio SQL editor), first verify the target profile ID, and update the plan and its limits together:

```sql
update public.profiles
set plan_key = 'pro', downloads_limit_monthly = 25, can_upload = true
where id = '<verified-profile-id>'::uuid
returning id, username, plan_key, downloads_used_this_month,
  downloads_limit_monthly, can_upload;
```

The Pro limit matches the existing local seed configuration. This example preserves current usage; a downgrade below the already-used quota will be rejected by the existing database constraint. Never expose an administrative key in the browser.

The upload action reads the current profile's `can_upload` before writing files. The `models`, `model_files`, and model/cover Storage INSERT policies independently require this permission, so direct API calls cannot bypass the action. Existing ownership and published-status checks remain in place. Reading and deleting previously uploaded own files remain available after access is revoked so cleanup can still complete. Avatar upload does not require creator access.

Upload access tests in `supabase/tests/database/model_upload_access.test.sql` cover guests, denied and allowed accounts, foreign folders, revoked permissions, and metadata cleanup. Unit tests also cover a missing profile and permission-query failure; both stop before any storage writes.

### Publication Editor Backend

- The target remains the first approved concept from 22 October: one large cover, editable UA/EN content, explicit Save Draft / Publish and a future-public-page preview. No autosave, gallery, 3D viewer, pricing-copy change or public Preview-button change. The plan and verification history are in `docs/superpowers/plans/2026-10-22-model-publication-editor.md`.
- Stage 1 metadata and Stage 2 assets/publication are applied locally only. The separately approved UI stage was connected on 25 October: My Models now offers creation and private drafts rather than mounting `ModelUploadForm`. Legacy form/action code and its isolated tests remain; no public model-management behavior was replaced.
- Use `profile/uploads/draft-actions.ts` for create/save/reserve/attach/release, minimal own draft reads and stable five-item pages; `publication-actions.ts` supplies publish/cancel/delete/cleanup. Inputs and all data boundaries use the new Zod schemas. These actions use the existing caller-bound SSR client, not an admin key.
- Generate a stable draft UUID once per create intent and reuse it after an uncertain create response. Save/attach with the last confirmed `revision`. A conflict requires rereading and reconciling, not overwriting another device's save. Partial titles/category are valid draft content; publication validation is separate.
- The narrow `manage_publication_draft` worker derives ownership from Auth and serializes writes by locking profile before draft. Create/reserve/upload/attach/publish check live `can_upload`; old own metadata reads/saves and cleanup survive revocation. Direct metadata grants remain for six columns, but frozen/pending rows cannot be updated directly.
- `uploadPublicationAsset` accepts actual File + owner/draft/revision and injected reserve/attach action callbacks. It validates limits/response paths, authenticates, uploads directly through the existing browser SDK with `upsert: false`, rechecks Auth, then attaches. Source bytes never go through a server action. No resumable package was added; retry restarts upload. Account changes, conflicts and failures leave durable server records rather than deleting the old active file.
- Draft buckets are private: 50 MiB source and 5 MiB single JPEG/PNG/WEBP cover. Reservation paths are immutable; attachment checks size/MIME against completed Storage metadata and only then retires the old asset. Signed cover URLs last 60 seconds; use the private reader, not the public cover resolver. A private-cover UI must still account for its Next Image configuration during the editor stage.
- Publishing freezes a complete saved draft, stores one model ID, copies two canonical existing-bucket destinations, then commits model/primary-file/publication state together. Retry a frozen publication with that same draft ID. After a confirmed published response, use existing model management for archive/edit/delete, not draft deletion.
- Cancelling closes the private destination ledger permanently for that attempt. It preserves active private originals and restores editing only after candidate cleanup; an explicit new publication gets a new ID. Public candidate covers may be reachable before model finalization and cannot be instantly removed from caches.
- The separately approved `storage.objects` BEFORE INSERT guard rechecks the final privileged write, not just a rolled-back RLS permission probe. It is private, narrowly scoped to new buckets/registered IDs, uses owner-aware checks and transaction locks, and leaves legacy upload behavior intact. Repeat the privileged-insert and actual SDK/concurrency probes after managed Storage upgrades and in the production migration rehearsal. Do not assume the remote Storage version is already compatible.
- Explicitly invoke `cleanupPublicationDraftAction` after successful attachment/publication to remove retired private originals, or retry it after an uncertain/partial cleanup. It validates all paths before Storage API removal and handles at most 100 private paths plus two candidate paths. A 15-minute unexpired reservation may return `cleanup_incomplete` even after an empty cleanup attempt; preserve the retry state. Delete requires `confirmed: true`. Do not perform raw SQL file deletion or lose the pending record.
- Actions bound Auth/RPC/Storage waits to ten seconds; browser transfer waits are bounded to five minutes. PostgREST consumes an AbortSignal; installed Storage copy/remove/upload have no per-call signal used by this helper, so an already-started transfer can finish after timeout. No later operation begins from its late response. Reread authoritative state before a new editing intent; the guard/ledger protect final late inserts.
- Administrative maintenance has USAGE on private plus its existing table rights; ordinary users cannot directly read/write destination records or execute the actor-aware checker/trigger. A draft/profile cascade is blocked if draft/candidate objects remain.
- Verification: 103 new real-role SQL checks, 439 total pgTAP checks, 77 new unit checks and 575 total units passed. Typecheck/build passed; lint has no errors and seven existing warnings; local security advisors found no issues. Actual generated public types match the saved TypeScript AST.
- One-off local diagnostics passed 50 real SDK checks using actual actions/helpers and file bytes, plus six assertions with two synchronized SQL transaction barriers. Temporary users/files/metadata were cleaned, and old 16-profile/49-model/zero-object counts were preserved. The SDK harness substitutes only Next cookie/cache and browser-client construction; this is not Next HTTP/cookie, browser or E2E QA and is not registered in CI.
- Windows reserved old 5532x ports. With user approval the local config/README now use API 54321, DB 54322, Studio 54323, mail 54324, shadow 54320, optional pooler 54329 and analytics 54328. Standard stop/start preserved volumes and downloaded current CLI images (Postgres 17.11.0.004, Storage v1.82.1); remote env/Windows reservations were not modified. The pre-existing vector log collector restart is outside this feature; DB/Auth/API/Storage checks passed.

### Publication Editor UI — Connected Locally

- Routes are `/profile/uploads/new` and `/profile/uploads/[draftId]`, under the existing localized/authenticated profile shell, with `noindex` metadata. Both reuse the bounded owned-model reader for current profile access and categories; the existing route also validates its draft ID and owner and reads only the private editor DTO. Guests redirect to localized login, missing/foreign drafts produce 404, and service failures do not fabricate an empty editor.
- My Models keeps existing public-model controls and `page` pagination. A separate `draftPage` parameter drives unfinished publications; both the exact count and range query exclude `lifecycle = published`, with owner validation and one bounded recount. Draft read failures have retry UI, not a fake empty list.
- The selected composition is a large single cover, language-switchable content, category/plan controls, a source row and sticky manual actions, using existing tokens, Lucide and shared controls. No generated sofa is inserted as real user content. There is no gallery, 3D-preview input, autosave or new dependency. Future-public-page preview is now connected as described below.
- Typing and choosing files are local only. The first explicit Save/Publish generates one stable create-intent ID; uncertain retries reuse it. Save persists metadata, then source/cover sequentially with the latest confirmed revision, then rereads and explicitly cleans retired objects. Only a fully confirmed save changes a new editor's route; partial work is retained on the server and in the open editor. No selected bytes are sent through server actions.
- The hook keeps the confirmed server snapshot separate from current form values and selected Files. Confirmed text and successful attachments survive a later failure; only an acknowledged selected file is cleared. Conflict or unconfirmed reconciliation blocks further edits/writes until an explicit saved-version load, with confirmation before discarding local values. A frozen publishing/cancelling/deleting draft exposes its appropriate retry/cleanup actions instead of editable fields.
- Publishing a complete unchanged saved draft stays enabled. A failed frozen copy retries the same publication; cancellation/deletion require the existing AlertDialog. Successful publication updates catalog/designer caches even if subsequent cleanup fails. Cleanup has its own retry control and never claims background removal. Published models remain managed through the previous model-management UI, not draft deletion.
- Ordinary client action waits are bounded to 15 seconds; each browser transfer retains the backend helper's five-minute bound plus transport allowance. An already-started action/upload may finish after timeout. The UI rereads instead of assuming rollback, never starts another step from a late response, and aborts its operation on unmount. The existing current-user query/session revision hides old editors and rejects another session's results; no new global Auth listener was added.
- Private covers use `next/image` with `unoptimized` so short-lived signed URLs are not fetched through the public image-optimization cache. A failed image offers an explicit signed-link refresh without saving/discarding text. Selected cover blob URLs are released on replacement/unmount; source bytes are never rendered as previews.
- The editor's own Back link asks before losing dirty values; `beforeunload` asks on page reload/close while dirty or pending. This is **not** a global App Router navigation blocker: sidebar/header links and browser Back/Forward still need an explicit final-QA decision. There is no history monkey-patching or undocumented router API.
- Verification: three new editor specs contain 46 checks, plus one new completed-list boundary test; the full unit suite passes 622/622 in 43 files. Typecheck, production build and formatting pass; lint has the same seven pre-existing warnings. The unchanged DB suite passes 439/439. Real components, RHF/Zod, React Query, messages and actions/helpers run with only SDK/Next boundaries and missing jsdom APIs controlled. No real unit-test network, new migration, production change, Git write, dev server or E2E run occurred.
- Final browser QA must verify actual HTTP/cookies, file-picker/transfer behavior, RSC navigation, keyboard/focus, sticky/mobile layout, and navigation-away coverage. Existing E2E expectations/POMs for the old upload form/optional 3D input will need updating then. No new E2E coverage is claimed here.

### Publication Page Preview — Connected Locally

- Preview opens in the existing fullscreen Sheet/Dialog, not a public draft route. Opening snapshots current RHF metadata and selected File references; closing/Escape preserves the mounted form and selected files. Reopening snapshots newer edits. No mutation, upload or publication is triggered.
- `ModelDetailHero`, `ModelDetailOverview` and `ModelFileList` share presentation between the preview and existing public server wrappers. Public queries, optimized cover, statistics, designer links and real Download behavior remain in those wrappers. Preview has disabled Download/profile navigation, no related-model query, fabricated catalog ID/slug, publication date or download count. Existing public disabled Preview controls remain unchanged.
- UA/EN controls switch current model text and file-size formatting without routing. Interface labels use the current editor locale. Incomplete titles/descriptions/cover/source have explicit placeholders, not fake published content. One cover is supported; source bytes are never parsed/rendered as a 3D viewer.
- `fetchPublicationPreviewAuthorAction` authenticates with `getUser`, compares the expected owner and reads only `profiles.id,username,avatar_path` through the session-bound client and existing RLS. It validates the response, resolves the public avatar and returns no private fields or admin credentials. It does not require current upload permission just to read an existing author's preview.
- Selected covers use an independently owned blob URL, released on close/unmount without revoking the editor's URL. Saved covers use the existing private draft read/signing action, `next/image` with `unoptimized`, and explicit refresh after image failure. Only the snapshot's same draft/cover asset and canonical signed URL are accepted; another device's replacement is not silently substituted. Refreshed metadata never overwrites local text or selected files.
- Author/cover reads have separate loading/error/retry states and run only while preview is mounted. Existing server waits are bounded to ten seconds; transport waits to fifteen. Per-session/per-instance query keys, cancellation and immediate unused-cache collection prevent applying late results after close or account/revision changes. Cancellation stops waiting, not an already dispatched server action; these actions are read-only.
- Verification: three preview specs add 42 checks; full unit suite 664/664 in 46 files. Existing public detail/files specs retain real CTA regression checks. Typecheck, build and formatting pass; lint has zero errors and the same seven pre-existing warnings. Local Security Advisor reports no issues. No schema/migration/dependency, dev server, browser/E2E, production or Git changes. The DB suite was not rerun for this presentation/read-only stage (last result 439/439).
- React review kept presentation free of data fetching, components outside render bodies and the author DTO limited to actual public fields. Final QA still needs real HTTP/cookies, focus/Escape, account-switch races, signed-image refresh, narrow-screen overflow and visual comparison with the public page.

### Owned Model Management

- `profile/uploads/management-actions.ts` exposes `fetchOwnedModelsPageAction`, `fetchOwnedModelAction`, `updateOwnedModelAction`, `setOwnedModelPublicationAction`, and `deleteOwnedModelAction`. The uploads page connects them to the own-model list, edit sheet and explicit deletion confirmation. Published-model metadata editing supports UA/EN titles/descriptions, category and minimum plan only; replacing published files/cover remains outside this scope. The new publication editor replaces assets only in unpublished drafts.
- Inputs are strict Zod schemas; types come from the generated local schema. The editor reader filters both model ID and authenticated creator, validates identity/status consistency, and returns only editor fields, never private asset paths. Missing/foreign models, Auth outages and malformed responses have distinct safe outcomes.
- Writes use the caller's `manage_owned_model` RPC, not an administrative SDK client. A private, narrowly implemented worker checks `auth.uid()`, locks profile then model, and validates the operation in SQL. General UPDATE privileges are not opened. `can_upload` is required for publication, not for editing, archiving or cleaning existing own assets after revocation. Publication also checks that source and cover Storage metadata exist; it does not inspect file contents.
- Deletion requires `{ modelId, confirmed: true }`. First persist `archived` plus `deletion_pending`, then remove validated owned paths through Storage API, then ask the RPC to finalize only if both folders are empty. Do not replace this sequence with a SQL Storage DELETE or deleting the model first. An error/timeout after beginning cleanup leaves a durable retry state; never clear the flag or republish partially removed files.
- A cleanup attempt handles at most 100 ordered paths per bucket. If objects remain, return `cleanup_incomplete` and retry to obtain the next remaining batch. The beta upload normally creates one source, one cover and an optional preview; no background worker or new dependency is introduced. Unknown providers, legacy seed paths, external/foreign references and unsafe returned paths require inspection rather than broad deletion.
- One ten-second deadline covers client creation, Auth, RPCs and Storage waits. PostgREST requests consume the abort signal. The installed Storage `remove(paths)` API has no per-call signal argument: its wait is bounded, but an already-started removal may complete after timeout. No subsequent removal/finalization starts from a late response; the pending row and next authoritative read reconcile the result. Framework control-flow errors are rethrown.
- After a write attempt, invalidate the existing profile/uploads/library, catalog/detail and designer/detail route patterns for both locales, including uncertain outcomes. The client hook also invalidates the existing catalog/designer roots and the owner's favorite IDs, then refreshes server data. Only confirmed mutations produce success feedback; status and pending state are reread without optimistic publication/deletion claims. If reconciliation also fails, writes stay disabled until an explicit successful reread or page reload.
- Archive retains files and first publication time. Unexpired signed URLs and public/cached covers are not instantly revoked. Final deletion preserves charged download events and does not refund quota. Existing owner DELETE permissions still support upload-failure cleanup; this is not a general background orphan-cleanup service.
- `model_management.test.sql` uses rollback-only Storage metadata fixtures and real roles. Only its fixture-removal segment sets `storage.allow_delete_query` locally, restoring it immediately; no real file bytes exist in those rows and application code never uses that setting. The anon RPC denial is checked through ACLs because of the documented local-image crash.
- `model-management-action.spec.ts` and `model-management-utils.spec.ts` use shared Supabase/Next boundary mocks and actual schemas. A separate one-off local SDK diagnostic passed 45 flow checks using real OBJ/cover/preview bytes and two temporary users: foreign denial, revoke/republish, pending-folder protection, partial cleanup, retry and actual object removal. Foreign bytes stayed intact; all temporary files, model and users were removed via Storage/Auth APIs. This was not Next.js HTTP/cookie or browser verification and is not registered as a CI test.
- The list action authenticates, validates the current profile/permission, fetches only safe model summary fields, and uses an exact HEAD count with stable `created_at DESC, id ASC` pages of five. Count and range are separate reads, not an atomic snapshot: one count/range mismatch triggers one recount; repeated inconsistency is a recoverable error. Empty accounts are returned only after a valid zero count. Out-of-range pages redirect to the current last page while preserving other URL parameters. Category failures disable upload/edit but do not hide valid archive/deletion controls. A missing file size is shown as unknown, not zero.
- `useModelManagement` reuses the existing current-user query and per-QueryClient session revision, with no additional Auth listener or module-level user state. Requests capture owner/model/revision; late results cannot update another session. Changing identity hides old rows and remounts open private controls; returning to the same account does not restore an old editor/error/deletion state. Shared mutation keys plus an immediate guard prevent duplicate pending writes.
- Editing uses the existing Sheet, React Hook Form/Zod and shared controls. The new AlertDialog wraps the already-installed Radix primitive following the shadcn composition; no dependency was added. Cancel receives initial focus, Escape cancels before submission, and dismissal/duplicate confirmation are blocked during cleanup. Errors keep entered values or the deletion retry dialog available; pending models cannot be edited/published. The dialog explains permanent file deletion and no quota refund.
- `model-management-ui.spec.tsx` and `profile-uploads.spec.tsx` exercise actual components, actions, providers, messages and toast UI through controlled Supabase/Next boundaries. HTTP cookies, RSC refresh, real focus restoration/mobile layout and full browser flow remain for final MVP QA; do not start dev or E2E during this stage.

### Download Quotas

- Monthly beta limits are Free 5 / Pro 25 / Max 100. Signup assigns Free 5; Pro/Max remain manual administrative assignments. Custom positive limits are preserved by the migration.
- Calendar months use UTC. One model consumes one quota unit per month regardless of file format or retries. A repeat still checks the current plan, publication status, and file availability.
- Call the generated `record_model_download` RPC with the user's session and verified model/file IDs, never a supplied user ID. It returns the generated `model_download_status` enum. Guests have no execute privilege.
- The private helper uses a profile row lock to serialize concurrent requests and records history, cached usage, and model popularity in one transaction. Direct user writes to `downloads` are forbidden; deleting a model preserves the charged event with a null model reference.
- Current-month history is authoritative. `profiles.downloads_used_this_month` refreshes on a new charged download and may be stale after a month boundary; do not use it alone to render current usage or assign a lower plan limit.
- `downloadModelAction` prepares a 60-second signed attachment URL, invokes the user-bound RPC, and exposes the URL only after `ok`; signing errors do not call the quota RPC. It accepts `{ modelId, fileId? }`, validates metadata and the canonical upload path, checks the signed URL origin/path/token, and encodes the original filename safely. Shared Download buttons are connected on model cards, the hero, and individual files. An issued link is not proof of completed file transfer and can be shared until expiration.
- The complete action has a ten-second deadline. Read/signing requests and the quota RPC are aborted on timeout; waiting for Auth is bounded without changing the existing SSR helper. A timed-out RPC may already have committed. Return no URL and let the user retry the same model; monthly deduplication prevents another charge.

Run `npm run test:db` for deterministic, rollback-based access/quota coverage in `supabase/tests/database/model_download_access.test.sql`: plan hierarchy, failures without writes, retries/alternate formats, UTC boundaries, legacy duplicate events, zero quota, transaction rollback, RLS isolation, and preserved history after model deletion. Storage fixtures here are metadata rows only, not uploaded files.

On 18 October, the then-current local image `public.ecr.aws/supabase/postgres:17.6.1.106` reproduced the upstream [function-permission error crash](https://github.com/supabase/postgres/issues/2112), recovered automatically and retained existing data. The guest RPC-denial assertion therefore inspects ACLs instead of deliberately executing a forbidden function; this does not grant access or weaken the production migration. The standard CLI restart on 22 October downloaded Postgres `17.11.0.004`, and the full DB suite passes. The specific upstream crash fix was not independently verified; keep that separate from the passing ACL assertions.

In addition to the repeatable pgTAP suite, three independent-connection checks forced overlap by holding a row lock until both requests were waiting: different models competing for one quota unit returned `ok` / `quota_exceeded`; same-model retries returned `ok` / `ok` with one event; two users downloading one model produced two events and a popularity increase of two. These were one-off local diagnostics, not tests registered in CI. Temporary users, model/file rows, and Storage metadata were removed afterward via SQL and the Storage API.

The server-action unit spec uses controlled client/network boundaries and real schemas. A separate one-off local diagnostic loaded the actual administrative helper in a Node server context (resolving Next's `server-only` marker to its server implementation), uploaded real OBJ sources, authenticated a separate downloader, and checked Storage signing plus the quota RPC. It verified exact file bytes, attachment disposition, a 60-second token, free repeats, and quota denial. Direct signing by a non-owner was rejected. Local missing-object signing returned HTTP status 400 with `statusCode: "404"`, which the action maps to `file_unavailable`. Files, models, and temporary users were removed afterward. This diagnostic does not exercise Next.js request cookies or the action's HTTP boundary; full browser coverage is deferred until final MVP QA.

### Download UI And File Summaries

- `DownloadModelButton` uses the real server action, React's pending transition and an immediate in-flight guard. Errors are translated in UA/EN through the existing toast UI. Only a successful action result creates an attachment link; no preview URL is used as a download source.
- Start the attachment request before refreshing data, so the short-lived URL is not delayed by cache refetches. Invalidate the existing catalog/designer query roots and refresh the current server route; do not optimistically increment counters or infer transfer completion.
- `ModelCardShell` keeps its optional full-card link separate from action buttons. The link and buttons have independent focus targets; icon-only file controls include the filename in their accessible name.
- `FilesTab` uses `fetchPublicModelFiles`, not fictional format entries. The reader verifies a published model with the user's client before scoped administrative access, selects only safe summary columns, validates the response with Zod, and excludes private storage metadata. Its administrative dependency is guarded by `server-only`; never import this reader into a client component.
- The reader uses a ten-second request abort signal and a 100-file display bound with stable primary/creation/ID ordering. Empty results and read/validation/overflow failures have separate localized states. Source formats currently support the existing Supabase `models` bucket only; this does not assert that the corresponding bytes still exist in Storage.
- `model-download-button.spec.tsx` and `model-files.spec.tsx` cover pending/duplicate clicks, safe summaries, explicit file IDs, failures, locale output and cache invalidation without real network. A read-only local Node diagnostic also invoked the real metadata reader/admin helper with a real anonymous SDK client in place of the unavailable Next.js cookie context: it returned the expected five summary columns without writes. Neither diagnostic substitutes for final browser QA.

### Profile Overview

- `get_profile_overview()` reads the current user's plan, actual stored monthly limit, freshly calculated UTC-month usage, published upload count and saved published model count in one SQL statement. It takes no user ID, runs as `SECURITY INVOKER`, keeps existing RLS and grants execution only to `authenticated`; no administrative key is used.
- The returned `downloads_used_this_month` is computed from history using the same distinct-model/null-event semantics as the download RPC. It is not the stored profile cache. Counts include the month-start instant and exclude the next month-start instant, regardless of session timezone. Custom limits and history exceeding a lowered limit are preserved; the UI clamps the remaining allowance at zero.
- `fetchProfileOverviewData` authenticates with the existing server client, calls the parameterless RPC, validates safe integer counts and the generated schema with Zod, and verifies the profile ID. Session loss redirects to the locale's login page; Auth outages, missing profiles, malformed data and RPC failures show a localized error instead of fabricated values. The action has a shared ten-second deadline and an abortable RPC; the existing Auth wait is bounded without changing the shared SSR helper.
- The action uses Next.js `unstable_rethrow` before handling ordinary exceptions. Request-time cookie access and framework redirect/not-found signals must not be swallowed by the generic data-error handler. The page therefore remains request-rendered rather than storing a prerendered error or a user's statistics as static content.
- The existing overview layout is preserved. Its four statistic cards have accessible group labels; fake numeric translation values and the fake activity message were removed. The supporting cards now link to the library and explain the actual monthly quota rules. Empty but valid accounts display real zeros, while failed reads show an alert and a retry link.
- The migration `20261019084815_profile_overview_stats.sql` is local only. `profile_overview_stats.test.sql` uses deterministic fixtures and rollback to cover access isolation, real plan assignment, custom/zero limits, UTC boundaries, more than 1000 duplicate history rows, removed models, stale caches and read-only behavior. `profile-overview.spec.tsx` covers the real action/page with only Supabase/Next runtime boundaries controlled; it does not exercise cookies over HTTP, hydration, or browser navigation.
- Browser/E2E QA remains deferred. The old profile page object still matches the fixed Ukrainian Free-plan badge and must be updated to actual plan badges during final QA, alongside the previously outdated library empty-state assertion. Favorite/follow and session-cache synchronization are implemented below; their real browser flows still require final QA.

### Profile Library

- The local migration `20261019094321_profile_library_pagination.sql` adds `get_profile_library_page(requested_tab, requested_page)`. It is read-only, `STABLE`, `SECURITY INVOKER`, has an empty `search_path`, and grants execution only to `authenticated`. The profile is derived from `auth.uid()`; never add a client-provided user ID or an administrative client to this reader.
- The SQL statement returns full downloaded/favorite/follow counts and only the active section's page, bounded to 24 public summaries. Downloads are grouped by model across all history before paging; only published models remain in model lists. Saved models above the current plan stay visible but do not grant download entitlement. Designer model counts are database aggregates rather than unbounded REST reads.
- Download ordering uses the latest recorded event, not the last repeat click. Favorites/follows use creation time; all orders include the target ID to break timestamp ties. Counts and cards share the same statement snapshot. No quota, popularity or history writes occur while reading the library.
- URL state uses `tab=downloaded|favoriteModels|subscriptions` and positive integer `page`; defaults are downloaded/page one. Changing sections resets the page, preserving other URL parameters and the locale. Invalid input falls back safely; out-of-range pages redirect to the clamped last page. The shared `ModelsPagination` component is reused without modifying its API.
- The reader validates the generated RPC contract and nested public summaries with Zod, strips extra fields, verifies caller identity and page/count consistency, and applies one ten-second deadline to the complete operation. It preserves Next.js control-flow exceptions. Missing sessions redirect to login; data failures/timeouts render translated alerts and retry links, never fake zeros or empty sections.
- The client derives its selected tab from server props rather than duplicating URL state in `useState`. Transitions show a localized pending message and disable tab switching while pending; tab names include separated localized counts. It receives only the selected page, with no admin credentials or private file metadata.
- `profile_library_pagination.test.sql` covers 49 real-role checks with rollback: repeats over 1000 rows, more than 24 models/designers, deterministic ties, counts, private-field exclusion, unpublished/deleted models, caller isolation, normalization and read-only behavior. The action and page/UI specs use real schemas, locale messages, shared UI and React Query, controlling only Supabase/Next runtime boundaries and missing browser APIs. No real network is used in unit tests.
- Client favorite/follow invalidation, error feedback and session synchronization are documented below. Browser refresh/back navigation, HTTP cookies, real navigation pending behavior, layout and final end-to-end flows still require final MVP QA; the dev server remains stopped.

### Favorites, Follows And Session Cache

- Existing `favorites` and `designer_follows` tables, composite primary keys and owner-scoped RLS are unchanged. No migration, administrative client or dependency was added. UUID inputs and row summaries are validated with Zod against the generated table fields; extra response fields are stripped. Invalid/failed reads are errors, not empty saved lists.
- Every private reader and writer verifies the current user with `getUser()` before using the requested owner. A missing session is distinct from an Auth outage; a different live user rejects the stale request before table access. Browser auth events update UI identity only, never authorize writes or assign permissions; RLS remains the database boundary.
- ID lists are read in ordered batches of at most 500, continuing after the last target UUID until an empty batch. This keyset pagination avoids the REST 1000-row cap and does not assume a short page means the end. Duplicate/backward IDs, malformed/oversized pages and later-page failures reject the entire read instead of returning partial flags.
- One ten-second deadline covers Auth plus every page or write in an operation. List queries consume React Query's AbortSignal; PostgREST requests are abortable. Auth itself is bounded without modifying the shared Supabase helper, and a late Auth response cannot start a timed-out write. Mutations do not automatically retry.
- Adds use `upsert` with the verified composite conflict key and `ignoreDuplicates: true`, equivalent to INSERT ON CONFLICT DO NOTHING, preserving an existing saved timestamp. Removes are owner/target-scoped deletes and may be repeated safely. This is idempotency: repeating the same add/remove intent has the same end state, rather than toggling it twice.
- Shared mutation keys prevent concurrent duplicate clicks on the same target across multiple cards. Confirmed writes update the corresponding user cache, re-read its authoritative IDs and refresh server-rendered data. There is no optimistic success before acknowledgement. Failures show translated Sonner messages and reconcile by reading current state; a timeout does not prove the database rejected the write. A successful reconciliation may also refresh the server route.
- Failed Auth/list reads show a distinct accessible retry control with no false `aria-pressed` value; retry checks Auth again when the error indicates a changed/expired session. Guests and self-follow remain hidden. Save/retry clicks prevent surrounding card navigation. Read errors do not generate one automatic toast per card; a failed manual retry reports the error through the existing toast UI.
- `QueryProvider` mounts one `useFavoritesSession` listener for all saved-item controls. Identity changes cancel and remove previous users' private queries, preserve public catalog/designer caches, and refresh the server route outside the synchronous auth callback. Unsubscription and pending refresh cleanup happen on unmount. Same-user token events do not reset lists or refresh repeatedly.
- Current identity is also revalidated on pathname changes because this app's login/logout server actions update cookies without necessarily emitting a browser auth event. A per-QueryClient session revision distinguishes separate sign-in periods, so late mutation callbacks cannot update another account. After switching away and back to the same user, the code re-reads the current data instead of applying an old click's intent. No user-specific state is held in production module globals.
- Unit coverage uses actual React Query/providers, schemas, locale messages, shared buttons and Sonner. Only Supabase/Next runtime boundaries and missing browser APIs are controlled. A separate one-off local SQL transaction verified duplicate adds and repeated deletes as `authenticated` with the existing RLS, then rolled back all fixtures. It was not an SDK/HTTP or browser test and is not registered in CI.
- Final MVP QA must still verify actual server-action cookies, cross-tab auth events, browser history/refresh, library pagination after removing the last item, visual layout and keyboard behavior in the real app. The dev server, browser and E2E remain stopped/deferred by the user's decision.

## Current Product Reality

There is a difference between existing code and product intent.

Implemented now:

- landing pages
- pricing
- auth
- profile shell

Planned later:

- marketplace catalog
- downloads
- subscriptions and payments
- creator uploads for 3D models
- moderation and operations

## Editing Guidance

- Reuse `shared` primitives before adding new ones.
- Keep route segments and locale handling consistent with existing structure.
- Prefer extending current design tokens and primitives over introducing a parallel design system.
- Preserve bilingual product intent in copy and feature planning.
- Keep diffs as small as possible and avoid unrelated cleanup.
- Preserve existing behavior during refactors unless the task explicitly changes logic.
- Never use `any`. Narrow `unknown` at boundaries with validation or type guards.

## Testing Strategy

Current testing setup:

- `Playwright` for end-to-end tests
- `Vitest` + `React Testing Library` for unit tests

Testing principles:

- test real user behavior rather than implementation details;
- cover the happy path first;
- add 1-2 meaningful edge cases;
- include at least one failure state when the flow can fail;
- keep tests deterministic by mocking network, controlling time, and avoiding flaky waits.

When implementing testable features, prefer designs that make side effects injectable or mockable rather than tightly coupled to browser or network state.

### Playwright Setup

- Playwright config lives in `playwright.config.ts`.
- E2E tests live in `e2e/` with a `fixtures -> pages -> tests` structure.
- Coverage and known gaps are tracked in `e2e/README.md`.
- The default local web server command is `node ./scripts/local-supabase.mjs dev --remote`.
- In CI, Playwright switches to `node ./scripts/local-supabase.mjs dev` so e2e can run against local Supabase without remote secrets.
- The browser context is pinned to `uk-UA` to keep locale-based flows deterministic.
- This keeps smoke tests focused on app behavior without requiring local Supabase containers.
- If a compatible app server is already running on `http://localhost:3000`, Playwright reuses it automatically.
- Browser binaries can be installed with `npm run e2e:install`.
- The initial smoke spec covers the default locale redirect and the home-to-pricing navigation path.

### CI Workflows

- `.github/workflows/quality.yml` runs lint, typecheck, format checks, and unit tests.
- `.github/workflows/test.yml` runs e2e tests separately.

### Vitest Setup

- Vitest config lives in `vitest.config.mts`.
- Unit tests live in `unit/` with a `fixtures -> mocks -> tests` structure.
- Coverage and known gaps are tracked in `unit/README.md`.
- The setup follows the current Next.js guide with `@vitejs/plugin-react` and `jsdom`.
- Path aliases are resolved through Vite's native `tsconfig` paths support.
- Shared cleanup is configured in `vitest.setup.ts`.
- The initial unit smoke spec covers `src/shared/hooks/use-mobile.ts`.
- Prefer unit coverage for hooks, utils, and synchronous client components.
- Async server components should continue to be validated primarily through e2e tests.
- `next-intl` must be listed in `server.deps.inline` in `vitest.config.mts` — without it Vitest cannot resolve `next/navigation` from inside the package under `next@16`.

#### Mocking conventions

- Mock external dependencies (`next/navigation`, `@tanstack/react-query`) at the module level with `vi.mock`.
- When mocking `next/navigation` in tests that use `next-intl` navigation helpers, always include `redirect` and `permanentRedirect` in the mock — `next-intl` calls them internally.
- Import real locale messages from `messages/en.json` instead of duplicating message objects inline in test files — inline copies drift out of sync with the real translations.
- Import real constants, schemas, and types from `src/business` or `src/shared` instead of redefining them in tests.
- Place shared mock factories and fixtures in `unit/fixtures/` or `unit/mocks/` so they can be reused across specs.

## Verification Expectations

Before closing a meaningful implementation task, the preferred quality gate is:

```bash
npm run typecheck
npm run lint
```

When the relevant test setup exists, also run the affected suites, for example:

```bash
npm run e2e
npm run test:unit
```

## SEO And Accessibility

This project should aim to be SEO-friendly and accessible by default.

Guidelines:

- use semantic landmarks like `header`, `main`, `nav`, `section`, `footer` where appropriate;
- keep heading hierarchy logical and avoid skipping levels without reason;
- prefer real text content over decorative-only hero implementations for important page meaning;
- make sure icon-only controls have accessible labels;
- ensure keyboard navigation and visible focus states work across interactive UI;
- use appropriate `alt` text for informative images and empty alt for purely decorative ones;
- keep locale-aware metadata and page copy aligned with `ua` and `en` content.

For public-facing pages, prefer approaches that support discoverability, crawlability, and fast first render.

## Performance Practices

- Prefer server components by default unless client interactivity is needed.
- Be careful with animation libraries on above-the-fold content.
- Avoid unnecessary re-renders, large client bundles, and heavy dependencies.
- Use optimized media and avoid shipping large visual effects where a lighter solution works.
- Treat performance as part of UX quality, especially for landing, catalog, and detail pages.
