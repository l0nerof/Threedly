# Closed Beta Release Readiness

Updated on 28 October 2026. The local rehearsal of the legacy-schema upgrade passed. Remote migrations, Auth settings, secrets and the Vercel deployment were not changed during this stage.

## What Has Been Verified

The core marketplace and editor are ready for final release QA. The latest full Chromium run on 27 October passed **93/93**, with no skipped/flaky/unexpected results; unit tests passed **693/693**. Local email/OTP/reset, profile/avatar, publication, downloads, quotas and failure scenarios were verified within the scope documented in the [E2E README](../e2e/README.md). This does not verify external email delivery or every browser.

The rehearsal on 28 October verified the upgrade through **14 unchanged migrations** and **439/439 pgTAP checks across eight files**. The main local stack retained 16 profiles, 49 models, 16 Auth users and 0 Storage objects. The separate test stack was removed.

Final report: `test-results/legacy-rehearsal/2026-10-28T10-33-43.245Z/report.json`. The repeated quality gate on 28 October passed typecheck and **693/693 unit tests across 49 files**; lint reported 0 errors and seven existing warnings. Scoped harness lint, formatting and diff checks also passed. The full E2E suite and build from 27 October were not repeated: this package changes only the local harness, SQL fixture and documentation, with no application-code or dependency changes.

## Remote State: Read-Only Inspection

On 28 October, Supabase MCP confirmed the following for `Threedly` (`hktrcsodvnaasvxyajpg`, eu-west-1):

- status `ACTIVE_HEALTHY`, PostgreSQL `17.6.1.063`;
- only the legacy `profiles` table in `public`: `id`, `username`, `avatar_path`, `bio`, `created_at`, `updated_at`;
- 1 Auth user, 1 profile and 1 object in the public `avatars` bucket, with a 5 MiB bucket limit;
- an empty migration history; no usernames violating the new constraint were found.

The inspection read structure and aggregate counts. The real profile, password, email and image were not copied into the rehearsal.

The Vercel project `threedly` uses Node `22.x`. Its latest production deployment is READY from **14 May 2026**, main, commit `91ecb625a423fbfb7ef7dc6df1202daa5965c193`. The later preview is not production. Project environment metadata contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for development/preview/production. **`SUPABASE_SERVICE_ROLE_KEY` was not found at project-env level**, although the current server-side download code requires it. Encrypted environment values were not revealed, so the URL/key pairing and actual runtime environment remain unverified.

These observations show a mismatch between the code and hosted schema. They do not establish the specific cause of the old deployment's error: its runtime logs still need inspection.

## How the Upgrade Was Verified

The first migration creates `profiles`, which already exists in the hosted project. Running all migrations normally conflicts with this table. Marking the first migration as applied without the matching schema would also be incorrect: migration history records completed changes; it does not create missing tables or permissions.

The chosen approach preserves data while transitioning to the verified initial schema. A reset would lose data; editing the old migration would create different histories for fresh and existing databases. The original migrations therefore remain unchanged.

The `scripts/rehearse-legacy-upgrade.mjs` harness:

1. Creates its own local `threedly-rehearsal` stack on free ports. It does not use hosted env, a linked project or the main local config.
2. Recreates the inspected legacy structure from `supabase/rehearsal/legacy-schema.sql`, then creates a synthetic Auth account, profile bio and actual PNG through the Storage API.
3. Creates a SQL archive and a separate copy of the avatar bytes. It restores the archive into another database in the temporary cluster and checks the profile, Auth, permissions and metadata; it restores the file through the Storage API at another temporary path and compares SHA-256.
4. Confirms the expected conflict with the unchanged first migration. An extra column and an incompatible username are rejected while preserving the old state.
5. Copies the six legacy fields inside a transaction, replaces only the expected legacy objects using the initial migration and restores the rows. It does not use `DROP ... CASCADE`: unexpected dependencies must stop the operation. A deliberate error rolls back the entire transition.
6. Before commit, compares the structure with an independent database where the initial migration ran from scratch. The comparison covers columns/defaults, constraints, indexes, RLS, functions/ACL, policies, triggers and grants. The input schema and empty history are also checked inside the transaction. This checks the listed objects, rather than auditing every possible PostgreSQL property.
7. Only after schema equality and data checks marks the first migration as applied **locally**, then applies the remaining 13 original files. It verifies all versions and source checksums.
8. Verifies the old login/password, unchanged UUID/username/bio/avatar/created_at and public avatar bytes, the Auth trigger when creating a new account through the Admin API with Free/5 defaults, and denial of self-assigned plan changes. This does not repeat browser signup/OTP. It runs the entire existing DB suite against this stack.

The initial transition preserves all six fields. A later existing migration raises the initial Free limit from 0 to 5, so `updated_at` may change; this is checked separately. Auth restoration compares synthetic account data without printing the password or its hash in the report.

### Running the Rehearsal Again

Prerequisites are installed repository dependencies, Node, Docker with a running engine and available Supabase images. The dev server is not required.

```powershell
node scripts/rehearse-legacy-upgrade.mjs
```

The command accepts no arguments and has no remote mode. It refuses existing `threedly-rehearsal` containers/volumes and concurrent runs. It does not reset or stop the main `threedly` stack; if that stack is running, it compares its aggregate counts before/after. Other projects' containers are untouched.

Artifacts are stored in git-ignored `test-results/legacy-rehearsal/<timestamp>/`: `report.json`, SQL archives, PNG, `review-bootstrap.sql`, compared schema JSON, migration log and pgTAP log. They contain only synthetic data and local configuration. **`review-bootstrap.sql` is a local rehearsal artifact for review; do not apply it to production without separate preparation and approval.**

Normal completion, including a failed check, removes the owned stack and lock in `finally`. Forcefully terminating the process or a Docker crash may leave `active.lock` or resources behind. Before retrying, inspect the PID in the lock, `report.json` and exact container/volume names. Remove only verified resources from that run using its saved workdir; do not use global cleanup or reset the main `threedly` stack.

### Rehearsal Limitations

- Verified local versions: Supabase CLI `2.121.0`, PostgreSQL image `17.11.0.004`, Auth `v2.197.0`, Storage `v1.82.1`. Hosted PostgreSQL is `17.6.1.063`; the hosted Storage version is unverified. Local guard compatibility does not establish compatibility with a different hosted runtime.
- The SQL backup includes the `public`, `auth` and `storage` schemas, their data and metadata. It is not a full backup of the cluster, roles, extension environment, Auth/SMTP configuration or Storage bytes. Avatar bytes are saved separately.
- Restoration uses a separate database in the same temporary cluster and an alternative Storage path. It does not verify restoration of the entire hosted project into an independent environment.
- Fields and policies are recreated from the verified hosted snapshot without real data. Before release, recheck drift — differences between the actual and expected schemas — and compatibility of real records.

## Remaining Launch Blockers

### Backup, Versions and Migrations

- [ ] Reread the actual hosted schema, grants/policies/dependencies, row counts, migration history and username format without modifying data.
- [ ] Identify the hosted Postgres/Auth/Storage runtime; verify the supported upgrade path and the three custom Storage triggers on the corresponding versions. Do not probe the old upstream PostgreSQL issue by directly making the unsafe internal RPC call.
- [ ] With separate approval, prepare a real backup of the database, Storage bytes and configuration, with secure storage and verified restoration. Do not assume paid backup/PITR is available or create a paid project.
- [ ] Prepare a specific production SQL/CLI plan for the current hosted schema and verify its transaction boundaries and recovery. The local rehearsal provides a basis, but is not that plan.
- [ ] Agree on a window without writes, a verified application version and checksums of the 14 migrations. Do not copy demo seeds containing test passwords/placeholder files.

### Auth, Email and Secrets

- [ ] Verify hosted email confirmation, allowed production UA/EN redirect URLs, Site URL, signup/reset templates, OTP expiry, resend/rate limits and password policy. The local allowance of 100 emails/hour is not a recommended production limit.
- [ ] Verify email delivery available without payment for beta, allowed recipients and actual signup/OTP/reset at the required addresses. Mailpit verifies the local chain, not external SMTP.
- [ ] Verify that the public URL and publishable key in Vercel belong to the intended Supabase project. With separate approval, add the matching `SUPABASE_SERVICE_ROLE_KEY` only to the server environment before launching the new version.

The service-role key bypasses RLS — database row-access rules. It is an administrative key: it must never receive the `NEXT_PUBLIC_` prefix or appear in browser bundles, screenshots or logs. Local keys cannot be used for the hosted project; do not copy a production secret into a publicly accessible preview.

### Security and Product

- [ ] Repeat Security Advisor after the approved hosted transition. The 28 October snapshot has three mutable `search_path` findings and two findings about direct `handle_new_user` execution by anon/authenticated; local hardening migrations and DB tests close these permissions, but have not run on hosted.
- [ ] Record the separate plan limitation: leaked-password protection is disabled and requires Pro or above. The free beta does not include purchasing Pro. Keep this warning distinct from the five DB fixes and from `npm audit`.
- [ ] Repeat the dependency audit before release: the latest full and production audits on 27 October reported 0 known vulnerabilities; that result applies to that date.
- [ ] Complete manual UA/EN desktop/mobile/keyboard QA, metadata and public URLs; verify a real model file and content rights. Clarifying the incorrect/expired OTP message remains a UX item; broader cross-browser/network coverage is documented in the E2E README.
- [ ] Identify the first beta participants and creators; assign Pro/Max and `can_upload` manually using verified profile IDs. Free/Pro/Max limits are 5/25/100 per UTC calendar month; repeating the same model does not consume another unit.

Sources for hosted warnings: [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [anon and SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated and SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [leaked-password protection plan requirement](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Release Sequence Requiring Separate Approval

1. Complete the checks above, prepare a reviewable production plan and backup/restore, then obtain separate approval to modify the hosted environment.
2. Pause writes for the agreed window; verify the fresh state and backup. Execute only the approved transition to the initial schema, check data/permissions, then correctly record the baseline and apply the remaining migrations.
3. Verify history, the old profile/avatar/login, Free defaults, protected functions/Storage and advisors. If anything differs, stop before reopening writes.
4. Deploy a compatible application version with verified env. Check hosted signup/OTP/reset, profile/avatar, catalog, private drafts, publication, downloads, repeat downloads and quotas, and cleanup of test data.
5. Open beta to friends only after the smoke check. Payments, the 3D viewer, pricing and public Preview buttons remain governed by the current product decisions.

A transaction rolls back only its own uncommitted changes. Later migrations already applied, new Auth records or Storage files require a separate recovery plan. Rolling back a Vercel deployment does not roll back the database; do not treat the local forced rollback as a complete production rollback.
