# Data Model

## Purpose

This document defines the MVP database structure for the Threedly marketplace.

The goal of this schema is to support:

- catalog browsing;
- model detail pages;
- user profiles;
- favorites;
- designer follows;
- download history and monthly limits;
- creator uploads;
- local seeding for frontend development.

This document reflects the current agreed MVP direction, not a final long-term marketplace schema.

## MVP Decisions

- Use `profiles` as the current source of user plan and quota state.
- Keep translations in explicit columns such as `title_ua` and `title_en`.
- Show image previews in catalog cards.
- Show optional 3D preview only on the model detail page.
- Store downloadable model files separately from the main model record.
- Use `downloads` as the source for user library and quota tracking.
- Use `designer_follows` as the source for user designer subscriptions.
- Keep categories flat for now, without nested hierarchy.

## Table Overview

| Table                      | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `profiles`                 | User profile and current account access state        |
| `categories`               | Flat catalog categories                              |
| `models`                   | Main marketplace model records                       |
| `model_publication_drafts` | Private unfinished publication content               |
| `model_publication_assets` | Registered private draft source/cover files          |
| `model_files`              | Downloadable files attached to a model               |
| `favorites`                | Models saved by users                                |
| `downloads`                | Download history, library source, and quota tracking |
| `designer_follows`         | Designer subscriptions/follows saved by users        |

## `profiles`

Stores public-facing user information and current account access state for MVP.

| Field                       | Type           | Notes                                                    |
| --------------------------- | -------------- | -------------------------------------------------------- |
| `id`                        | `uuid`         | Primary key. References `auth.users.id`.                 |
| `username`                  | `text`         | Unique public username. Lowercase format is recommended. |
| `avatar_path`               | `text \| null` | Path to avatar file in storage.                          |
| `bio`                       | `text \| null` | Short user biography or description.                     |
| `plan_key`                  | `plan_key`     | Current plan key enum: `free`, `pro`, `max`.             |
| `downloads_used_this_month` | `integer`      | Number of downloads already used in the current month.   |
| `downloads_limit_monthly`   | `integer`      | Monthly download limit for the current plan.             |
| `can_upload`                | `boolean`      | Whether the user can upload marketplace models.          |
| `created_at`                | `timestamptz`  | Profile creation timestamp.                              |
| `updated_at`                | `timestamptz`  | Last profile update timestamp.                           |

### Notes

- This table intentionally includes plan and quota fields for MVP simplicity.
- In a future billing phase, plan and entitlement logic can be extracted into separate subscription-related tables.
- Authenticated users can update only their own `username`, `bio`, and `avatar_path`. Plan, quota, upload permission, IDs, and timestamps are not user-editable.
- Profiles are created by the auth signup trigger, not by direct client inserts. Administrative access retains the ability to assign beta plans and quota.
- New Free profiles receive a monthly limit of 5. Manual beta assignments use Pro 25 / Max 100; the RPC reads the stored limit rather than hard-coding it. The quota migration upgrades legacy Free profiles with a zero limit to 5 and preserves custom positive limits.
- `downloads_used_this_month` is a cache refreshed when a new model download is recorded, not a clock-driven monthly reset. Access decisions use current UTC-month history. Profile overview now reads freshly calculated usage through `get_profile_overview`, rather than assuming this stored cache is fresh after a month change.

### Profile Overview RPC

`public.get_profile_overview()` is an authenticated-only, stable, security-invoker SQL function with an empty `search_path`. It takes no user ID: the profile is selected exclusively through `auth.uid()`, and existing RLS remains in force. It only reads data and does not require an administrative key.

The function returns at most one row containing `profile_id`, `plan_key`, `downloads_limit_monthly`, computed `downloads_used_this_month`, `published_uploads`, and `favorite_models`. Usage matches the download RPC: distinct non-null model IDs in the current UTC calendar month, plus every preserved null-model event. Draft, archived and deleted models still consume their original quota; legacy repeats of an existing model count once. Previous/future months and another user's history are excluded.

Uploads count only the user's published models. Favorites count only their saved published models, including models above their current plan; visibility in favorites is not a download entitlement. These counts are not capped by the library's 24-card display bound or the REST row limit. Existing profile, creator, favorite and user/month indexes support the scoped aggregates. Reading never updates cached usage, history or popularity.

The server action verifies the session, validates the response against its generated contract and checks profile identity. Missing profiles, invalid data and service failures produce a read-error state rather than invented Free/zero statistics. A ten-second shared deadline bounds the request. The page calculates remaining quota as `max(limit - used, 0)`, uses the actual assigned plan and preserves UA/EN formatting. This is a display snapshot, not authorization for a later download; the download RPC still checks live access independently.

## `categories`

Stores flat catalog categories.

| Field            | Type           | Notes                                        |
| ---------------- | -------------- | -------------------------------------------- |
| `id`             | `uuid`         | Primary key.                                 |
| `slug`           | `text`         | Unique stable URL key, for example `chairs`. |
| `name_ua`        | `text`         | Category name in Ukrainian.                  |
| `name_en`        | `text`         | Category name in English.                    |
| `description_ua` | `text \| null` | Optional Ukrainian category description.     |
| `description_en` | `text \| null` | Optional English category description.       |
| `created_at`     | `timestamptz`  | Creation timestamp.                          |

### Notes

- No `parent_id` is included in MVP because nested category hierarchy is not required yet.
- No `sort_order` is included in MVP because ordering can initially be driven by query logic or admin conventions.
- `categories` and `category_groups` use RLS with public read policies. Only administrative access can write category data.

## `model_publication_drafts`

The local Stage 1 migration `20261022155024_model_publication_drafts.sql` stores unfinished publication content separately from catalog `models`. Stage 2, `20261022171015_model_publication_assets.sql`, adds file persistence, revision checks and publication/cleanup state. Both are local only; the new editor UI is not connected and the old upload still publishes immediately.

| Fields                              | Contract                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `creator_id`                  | UUID identity/owner; owner references `profiles`. Direct writes cannot set these fields. The owner-checked create RPC accepts a stable requested draft UUID as its retry key and never overwrites an existing or foreign draft. |
| `title_ua`, `title_en`              | Non-null partial strings, default empty, up to 90 characters.                                                                                                                                                                   |
| `description_ua`, `description_en`  | Nullable text, up to 600 characters each.                                                                                                                                                                                       |
| `category_id`                       | Optional existing category; category deletion clears the reference.                                                                                                                                                             |
| `minimum_plan`                      | Existing `free` / `pro` / `max` enum.                                                                                                                                                                                           |
| `created_at`, `updated_at`          | Database-assigned timestamps.                                                                                                                                                                                                   |
| `revision`                          | Nonnegative integer incremented on every draft UPDATE, including pointer/lifecycle changes.                                                                                                                                     |
| `lifecycle`                         | `draft`, `publishing`, `published`, `cancelling` or `deleting`.                                                                                                                                                                 |
| `source_asset_id`, `cover_asset_id` | Nullable references to selected private asset records, cleared after confirmed publication.                                                                                                                                     |
| `publication_model_id`              | Nullable unique model UUID reserved before copying. It is retained after publication, not a foreign key to a deletable public model.                                                                                            |

RLS exposes only owned rows. Creating and reserving/uploading/attaching/publishing require live `profiles.can_upload`. Reading and saving existing own text, cancellation and cleanup remain available after revocation. Six metadata columns retain direct INSERT/UPDATE grants, but direct UPDATE is limited to lifecycle `draft`. IDs, ownership, timestamps, revision, pointers and lifecycle are not directly user-writable; DELETE/structural privileges are not granted. Honest editor writes use the revision-checked RPC; column privileges do not make arbitrary direct metadata updates participate in that conflict protocol.

The private invoker timestamp trigger sets `updated_at = statement_timestamp()` and increments revision. Owner/update/ID and foreign-key indexes support scoped paging and cleanup. Generated Insert/Update types describe columns, not these grants. The existing `models.status = draft` is a separate legacy concept and is unchanged.

### `model_publication_assets` And Private Storage

Each asset stores UUID `id`, `draft_id`, `kind` (`source`/`cover`), unique immutable `object_path`, original `file_name`, `extension`, `mime_type`, `byte_size`, `state`, `upload_expires_at` and `created_at`. States are `reserved`, `active`, `retired` and `deleting`. A partial unique index permits one active asset per kind per draft. Only own SELECT is granted to authenticated users; writes go through the narrow worker. Administrative access retains maintenance rights.

The RPC reserves `<creator>/<draft>/<asset>.<extension>` before browser-to-Storage upload. Private buckets are `model-draft-files` (50 MiB; seven existing source formats; octet-stream) and `model-draft-images` (5 MiB; JPEG/PNG/WEBP). There is one active cover, no gallery or 3D-viewer input. Reservations expire after 15 minutes; a draft can retain at most 100 asset records pending attachment/cleanup. Existing SDK uploads restart after interruption, without a resumable dependency.

Attaching requires existing Storage metadata with matching size/MIME, live permission and the expected draft revision. Only then is the old selected asset retired and the replacement selected. Private paths cannot be overwritten, and active files cannot be deleted. A short signed URL (60 seconds) delivers the private cover; editor readers return minimal summaries, not arbitrary Storage references. Already-issued links/cache are not instantly revoked.

### Publication RPC And Managed Storage Guard

`manage_publication_draft(requested_draft_id, requested_operation, requested_revision, requested_payload)` is an authenticated invoker wrapper around a private definer worker. The worker checks identity/ownership, pins an empty search path and locks profile before draft. Operations are `create`, `save`, `reserve`, `attach`, `release`, `prepare_publish`, `finish_publish`, `cancel_publish`, `begin_delete`, `cleanup` and `finish_cleanup`. Payloads are strict whitelists; reads/writes never accept a creator ID from the client.

Preparation requires trimmed bilingual titles of at least two characters, a category and two complete active files. It freezes the draft, reserves one model ID and registers immutable source/cover destinations. Session-bound Storage copy preserves canonical existing `models` / `model-images` paths. Finalization checks copied metadata and commits the public model, primary file and published draft state in one database transaction. Repeating preparation/finalization of that publication returns the same model; it does not allocate duplicates. This verifies metadata availability, not file decoding, antivirus scanning or content authenticity.

The non-exposed `private.model_publication_destinations` ledger stores model/owner/draft IDs, canonical source/cover paths and `publishing`/`closed`/`published` state. Closed IDs remain blocked after draft deletion; profile deletion cascades the ledger. Cancelling keeps private originals, removes candidate destinations and restores an editable draft only after cleanup. A new explicit attempt after cancellation allocates a new ID.

The user-approved private `guard_publication_storage_insert` trigger revalidates actual INSERTs in `storage.objects`, including privileged final Storage writes after rolled-back RLS probes. It covers only draft buckets and registered publication IDs, not legacy upload folders. Its internal actor-aware checker has no application execute grants; the RLS wrapper derives the actor from `auth.uid()`. The final trigger uses the authenticated actor, or registered Storage owner metadata for trusted internal writes, and holds transaction locks through actual insertion. Keep the guard under regression tests after Storage upgrades.

### Retryable Cleanup And Boundaries

Release/cleanup marks non-active records deleting; the server validates all returned owned paths before Storage API deletion. At most 100 private objects plus two candidate destinations are returned per attempt. Finalization checks that bytes are absent; an unexpired reservation or failed/partial removal leaves `cleanup_incomplete`. Explicit deletion requires confirmation; published models use existing owned-model management instead. A profile/draft deletion guard blocks cascades that would leave draft/candidate metadata behind. Tests remove only rollback-only Storage metadata fixtures with the local test setting; application code never deletes Storage objects through SQL.

Actions share a ten-second deadline, validate responses and invalidate existing route patterns after write attempts, including uncertain results. Browser transfers have a five-minute bounded wait and recheck Auth before attachment. The SDK Storage wait can time out while an already-started transfer finishes later; actual-state guards and durable reservations/destinations handle that possibility. After replacement/publication, callers explicitly invoke cleanup for retired originals; successful publication is not a promise that cleanup has finished. No autosave, background orphan cleaner, billing change or UI switch was introduced.

A candidate cover is public once copied to `model-images`, even if database finalization later fails. Cancellation/deletion cannot instantly retract cached/public URLs. The source remains in private buckets. HTTP cookies, browser session changes, file-picker behavior, page preview and visual QA remain for the editor/final MVP stages.

## `models`

Stores the main content record for each 3D model visible in the marketplace.

| Field                | Type                  | Notes                                                                             |
| -------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `id`                 | `uuid`                | Primary key.                                                                      |
| `slug`               | `text`                | Unique stable URL key for the model page.                                         |
| `creator_id`         | `uuid`                | References `profiles.id`. Identifies the uploader or creator.                     |
| `category_id`        | `uuid`                | References `categories.id`.                                                       |
| `title_ua`           | `text`                | Model title in Ukrainian.                                                         |
| `title_en`           | `text`                | Model title in English.                                                           |
| `description_ua`     | `text \| null`        | Ukrainian description.                                                            |
| `description_en`     | `text \| null`        | English description.                                                              |
| `cover_image_path`   | `text`                | Main image used in the catalog card and hero area.                                |
| `preview_model_path` | `text \| null`        | Optional lightweight 3D preview asset for the model detail page.                  |
| `status`             | `model_status`        | Publication status enum: `draft`, `published`, `archived`.                        |
| `deletion_pending`   | `boolean`             | Durable cleanup intent; defaults to false and requires archived status when true. |
| `minimum_plan`       | `plan_key`            | Minimum plan required to download the model: `free`, `pro`, or `max`.             |
| `file_format`        | `text \| null`        | Primary display format for UI summaries, for example `glb` or `fbx`.              |
| `file_size_bytes`    | `bigint \| null`      | Size of the primary downloadable file for quick UI display.                       |
| `polygon_count`      | `integer \| null`     | Optional technical metadata for the asset page.                                   |
| `download_count`     | `integer`             | Cached counter for popularity display.                                            |
| `is_featured`        | `boolean`             | Whether the model can appear in featured UI sections.                             |
| `created_at`         | `timestamptz`         | Creation timestamp.                                                               |
| `updated_at`         | `timestamptz`         | Last update timestamp.                                                            |
| `published_at`       | `timestamptz \| null` | When the model became publicly visible.                                           |

### Notes

- `cover_image_path` is stored directly on `models` because MVP only needs one primary image per model.
- `preview_model_path` is intentionally separate from downloadable files so the product can use a lighter preview asset on the detail page.
- Catalog pages should use only the image preview, not the live 3D asset.
- Uploaded cover images are stored in the public `model-images` bucket.
- Downloadable source files and optional lightweight 3D previews are stored in the private `models` bucket.
- The current upload MVP still publishes successful uploads immediately. Unfinished publication text now has a separate metadata-only `model_publication_drafts` foundation; its editor, files and publication are not connected yet. The existing model-status enum is unchanged.

### Owned Model Management

The local migration `20261019110521_model_management.sql` adds `deletion_pending` and `manage_owned_model(requested_model_id, requested_operation, requested_metadata)`. Operations are `update`, `archive`, `publish`, `begin_delete`, and `finish_delete`. The public function is authenticated-only, `SECURITY INVOKER`, with an empty `search_path`. Its worker is a private-schema `SECURITY DEFINER` function: direct model UPDATE is not granted, so the worker can change only the explicitly implemented fields after checking `auth.uid()` and ownership. It never accepts an owner ID. Both functions have explicit execution ACLs.

The worker locks the caller's profile for share, then the owned model for update. A row lock is a short queue for operations touching the same record; this order matches the existing profile-before-model download flow. Management requests for one model serialize, and permission revocation cannot race past the profile permission read. SQL role checks, not user metadata or a client-visible administrative key, authorize the operation.

Metadata is a strict six-field object: `titleUa`, `titleEn`, `descriptionUa`, `descriptionEn`, `categoryId`, `minimumPlan`. Both titles are trimmed and limited to 2–90 characters, descriptions to 600; empty descriptions become null. Category existence and plan values are checked in SQL as well as at the server boundary. Slug, ownership, files, feature flags and counters are not editable. Archive preserves assets and first-publication time. Publish additionally requires live `can_upload`, an existing scoped Supabase source and cover Storage metadata; this checks metadata availability, not file validity. A revoked creator can still edit, archive or delete existing own models.

Deletion is deliberately staged because database writes and Storage object removal cannot share one transaction. `begin_delete` persists archived status plus `deletion_pending` before cleanup, validates asset references, and returns only this owner's model-folder objects in the `models` / `model-images` buckets. Each ordered batch contains at most 100 paths per bucket, including leftover files not referenced by `model_files`. The server validates all returned paths before any Storage API removal. `finish_delete` checks that no objects remain in either folder before deleting the model; file metadata/favorites cascade, while charged download history keeps its existing null-reference behavior. More than one batch or a partial failure leaves a retryable pending row, not a false success. Repeating a completed deletion returns `model_unavailable` without writes.

Pending models cannot be edited or republished. Model/file/Storage INSERT policies reject new pending state or attachments to a pending model; creation also requires zero popularity and no featured flag. Existing owner read/delete and failed-upload cleanup rights remain. Direct UPDATE, TRUNCATE, REFERENCES and TRIGGER grants on models/files are revoked from application roles. Existing INSERT/DELETE grants still use RLS; this is not an orphan-cleaner for arbitrary direct Storage/API activity outside the app workflow.

Only canonical current-upload paths are cleaned automatically. Legacy `demo/...`, external assets, foreign paths or other providers return `storage_unavailable` and keep the model hidden/pending for administrative inspection; unrelated objects are never deleted. Archiving does not retract previously issued signed links (up to 60 seconds), public cover URLs or downloaded/cached copies. UI controls, HTTP/cookie verification and browser QA are separate later work.

## `model_files`

Stores downloadable files for a model.

| Field              | Type               | Notes                                              |
| ------------------ | ------------------ | -------------------------------------------------- |
| `id`               | `uuid`             | Primary key.                                       |
| `model_id`         | `uuid`             | References `models.id`.                            |
| `storage_provider` | `storage_provider` | Storage provider enum: `supabase` or `r2`.         |
| `bucket`           | `text`             | Storage bucket or container name.                  |
| `object_path`      | `text`             | Path to the file inside the storage provider.      |
| `file_name`        | `text`             | Original or display file name.                     |
| `format`           | `text`             | File format such as `glb`, `fbx`, `obj`, or `max`. |
| `file_size_bytes`  | `bigint`           | File size in bytes.                                |
| `is_primary`       | `boolean`          | Marks the main downloadable file for the model.    |
| `created_at`       | `timestamptz`      | Creation timestamp.                                |

### Notes

- This table supports both simple and more advanced cases.
- A model can have one file in MVP and later expand to multiple files without changing the main schema.
- Keeping `storage_provider`, `bucket`, and `object_path` separate avoids locking the product into one storage vendor.
- `fetchPublicModelFiles` verifies the model is published using the session-bound client before a scoped administrative read. It returns only validated `id`, `file_name`, `format`, `file_size_bytes`, and `is_primary` values; storage paths, bucket names, credentials, and signed URLs are not part of this public summary.
- The current file list supports Supabase's `models` sources, ordered by primary flag descending, creation time and ID ascending. Reads share a ten-second abort signal and are bounded to 100 files; overflow or malformed rows produce a recoverable error instead of a partial list. This is a display bound, not a new database constraint.

## `favorites`

Stores user-saved models.

| Field        | Type          | Notes                                  |
| ------------ | ------------- | -------------------------------------- |
| `user_id`    | `uuid`        | References `profiles.id`.              |
| `model_id`   | `uuid`        | References `models.id`.                |
| `created_at` | `timestamptz` | When the model was added to favorites. |

### Notes

- This is a many-to-many relation between users and models.
- A composite unique constraint on `user_id` and `model_id` is recommended.

## `downloads`

Stores download history for models.

| Field        | Type           | Notes                                                           |
| ------------ | -------------- | --------------------------------------------------------------- |
| `id`         | `uuid`         | Primary key.                                                    |
| `user_id`    | `uuid`         | References `profiles.id`.                                       |
| `model_id`   | `uuid \| null` | References `models.id`; becomes null when the model is deleted. |
| `created_at` | `timestamptz`  | When the download happened.                                     |

### Notes

- This table is the source for the user library in MVP.
- The library groups available published models across the user's entire download history before pagination; its count is not monthly quota usage.
- This table also supports monthly quota calculations and popularity metrics.
- A model consumes one quota unit per calendar month in UTC, including all its file formats. Repeating it within that month does not insert another event or increase the model's popularity counter. Downloading it in a later month consumes a new unit.
- Repeats still require a published model, the current minimum plan, and valid existing file metadata. They are not a permanent entitlement and remain free within the month even when the quota is exhausted.
- Authenticated users can read only their own history. Direct INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, and TRIGGER privileges are revoked; administrative access remains available for maintenance and seeds.
- Deleting a model preserves charged events with `model_id = null`, so deletion cannot restore quota. Each such event counts toward its original month; the library skips missing models. Deleting the user still removes their history.

### Profile Library RPC

`public.get_profile_library_page(requested_tab text, requested_page integer)` is a stable, authenticated-only, security-invoker SQL function with an empty `search_path`. The profile comes only from `auth.uid()` and existing RLS remains active. It returns at most one row with profile identity, the normalized tab/page, total pages, all three full section counts, and bounded public `models` / `designers` JSON arrays. It does not accept a user ID, use an administrative key or mutate data.

Tabs are `downloaded`, `favoriteModels`, and `subscriptions`. Only the active tab's array is populated, with at most 24 items. Downloaded models are grouped before counting/paging and ordered by their latest recorded history timestamp descending, then model ID ascending. Same-month repeat downloads do not create a new history event, so this is not a last-click timestamp. Favorites and follows use saved timestamps descending with target ID as a stable tie-breaker. Favorites and downloads explicitly include only published, non-deleted models, including models above the user's current plan; downloading still requires live access and quota checks. Removing a model from these lists does not refund its historical quota.

Counts and page contents are computed within one statement. Designer portfolio counts are SQL aggregates of published models, not a REST list truncated at 1000 rows. Public summaries exclude private preview/source paths and service-only profile fields. Empty sections have one logical page and empty arrays; missing sessions/profiles return no row. Invalid tabs/pages normalize to defaults, and oversized page numbers clamp to the last available page without integer-offset overflow.

Numbered OFFSET pagination deliberately reuses the existing MVP pagination UI. It is suitable for the closed beta's per-user collections; deep pages still scan skipped records. Cursor pagination is the alternative if real usage grows, but would change the navigation contract. Existing owner/creator indexes support scoped reads; no new indexes or dependencies were added.

The server validates URL input and the generated RPC response with Zod, including profile identity, safe counts, unique IDs, page length and inactive-array consistency. A shared ten-second deadline bounds client creation, Auth and the abortable RPC. Framework control-flow exceptions are rethrown. The page retains errors/timeouts separately from valid empty lists; guests go to localized login. URL tab/page state supports refresh and history navigation, resets the page when switching tabs, and redirects out-of-range pages to a valid page. This does not yet implement favorite/follow mutation refresh or account-session listeners; those remain separate work.

### Download Recording RPC

`public.record_model_download(requested_model_id uuid, requested_file_id uuid)` is an authenticated-only, security-invoker RPC. A security-definer helper in the non-exposed `private` schema performs privileged writes with an empty `search_path` and derives the user exclusively from `auth.uid()`.

The helper locks the current profile before checking the plan and quota, serializing requests from the same user. It accepts only a file attached to the requested model, using Supabase's `models` bucket and the current upload layout `<creator-id>/<model-id>/<filename>`. The corresponding `storage.objects` row must exist. Other providers, foreign paths, missing files, unpublished models, and insufficient plans are rejected before writes.

It counts distinct model IDs in the UTC month (plus preserved events for deleted models), then records history, refreshes cached usage, and increments model popularity in one transaction. A failure rolls back all three writes. Existing `(user_id, created_at)` indexing supports the bounded monthly history query; no scheduler or new dependency is required.

The generated `model_download_status` enum returns `ok`, `unauthorized`, `model_unavailable`, `file_unavailable`, `plan_required`, or `quota_exceeded`. Guests lack permission to call the RPC. A successful result records authorization to download; it does not prove that the browser received the complete file.

`downloadModelAction` prepares a 60-second attachment URL without exposing it, invokes this RPC with the user's session, and returns the URL only after `ok`. A signing failure never calls the recording RPC. Shared Download buttons now invoke the action from model cards, the hero and the real `FilesTab` list. SQL tests verify Storage metadata, not actual stored bytes; a separate local Storage/RPC diagnostic fetched real OBJ bytes.

### File Delivery Server Action

The action accepts only `{ modelId, fileId? }`, validates UUIDs and rejects extra input fields. The current user's profile and the published model are fetched with the session-bound client. A `server-only` administrative client reads only the scoped `model_files` row and signs the file; it never records quota. Existing RLS and private-bucket policies are unchanged.

Without `fileId`, the action picks one file ordered by primary flag descending, then creation time and ID ascending. With `fileId`, it filters by both model and file ID. Metadata must match the requested model and its creator's canonical upload path, calculated with the existing upload filename sanitizer. Only the existing Supabase `models` storage contract is accepted.

The action validates the signed URL's origin, path, and non-empty token before recording quota. It adds the original filename through `URLSearchParams`, rather than interpolating it into the query string. Only the final URL or a typed error is returned; credentials, raw database errors, and prepared-but-denied URLs are never returned or logged.

A shared ten-second deadline bounds the flow. PostgREST and administrative requests receive an abort signal; the Auth wait is bounded even though the existing SSR helper does not expose fetch cancellation. If an RPC request times out after the database committed, the action cannot know whether the charge happened: it returns no URL, and retrying the same model within that month does not charge again. Successful link issuance is not proof of a completed browser transfer, and an unexpired link can be shared by its recipient.

The client starts an attachment download only on success, prevents repeated clicks while pending, and displays localized typed failures. It invalidates catalog/designer query data and calls `router.refresh()` to refresh server-rendered data, including the library on its route. Cards keep a full-card link separate from action buttons. These interactions have deterministic unit coverage; real browser delivery, Next.js cookies and the HTTP action boundary remain deferred until final MVP QA.

## `designer_follows`

Stores designer profiles followed by users.

| Field         | Type          | Notes                                            |
| ------------- | ------------- | ------------------------------------------------ |
| `follower_id` | `uuid`        | References `profiles.id`. The current user.      |
| `designer_id` | `uuid`        | References `profiles.id`. The followed designer. |
| `created_at`  | `timestamptz` | When the designer was followed.                  |

### Notes

- This is a many-to-many relation between users and designer profiles.
- A composite primary key on `follower_id` and `designer_id` prevents duplicate follows.
- A check constraint prevents a user from following their own profile.
- This table is separate from `favorites` because saving a model and following a designer are different product concepts.

## Relationships

- `profiles.id` -> `auth.users.id`
- `models.creator_id` -> `profiles.id`
- `models.category_id` -> `categories.id`
- `model_files.model_id` -> `models.id`
- `favorites.user_id` -> `profiles.id`
- `favorites.model_id` -> `models.id`
- `downloads.user_id` -> `profiles.id`
- `downloads.model_id` -> `models.id`
- `designer_follows.follower_id` -> `profiles.id`
- `designer_follows.designer_id` -> `profiles.id`

## Translation Strategy

MVP uses explicit bilingual columns instead of JSON translation objects or separate translation tables.

Examples:

- `title_ua`
- `title_en`
- `description_ua`
- `description_en`

This approach is preferred for the current product because:

- only `ua` and `en` are required right now;
- it is easier to type and query;
- it keeps the schema simple for seed data and frontend integration.

## Preview And Performance Strategy

To protect catalog performance:

- catalog cards should render only `cover_image_path`;
- the model detail page may render a 3D preview from `preview_model_path`;
- the downloadable source asset should remain in `model_files`;
- the 3D preview asset should be lightweight and optimized separately from the full downloadable source file.
- if `preview_model_path` is empty, the detail page should fall back to the cover image until a preview-ready GLB/GLTF exists.

This separation allows the product to keep a premium browsing experience without forcing every page view to load heavy 3D files.

## Local Seed Expectations

The local seed should support frontend development without requiring production-like storage complexity.

Recommended local seed behavior:

- create a small set of categories;
- create several profiles with different plans;
- create a realistic set of models across categories;
- attach one or more `model_files` records per model;
- seed favorites for saved-model UI states;
- seed designer follows for subscriptions UI states;
- seed downloads for library and quota-related UI states.

For local frontend work:

- `cover_image_path` may point to local demo assets;
- `preview_model_path` may point to small optimized local preview assets;
- `model_files` may use local Supabase Storage paths or stubbed development assets depending on the setup.

## Out Of Scope For This MVP Schema

The following are intentionally not part of the current MVP schema:

- nested categories;
- tag taxonomy and `model_tags`;
- multi-image model galleries through a separate `model_images` table;
- billing provider integration tables;
- moderation and admin workflows;
- teams or organization accounts.

These can be added later if the product direction requires them.
