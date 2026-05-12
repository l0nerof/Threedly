# Data Model

## Purpose

This document defines the MVP database structure for the Threedly marketplace.

The goal of this schema is to support:

- catalog browsing;
- model detail pages;
- user profiles;
- favorites;
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
- Keep categories flat for now, without nested hierarchy.

## Table Overview

| Table         | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `profiles`    | User profile and current account access state        |
| `categories`  | Flat catalog categories                              |
| `models`      | Main marketplace model records                       |
| `model_files` | Downloadable files attached to a model               |
| `favorites`   | Models saved by users                                |
| `downloads`   | Download history, library source, and quota tracking |

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

## `models`

Stores the main content record for each 3D model visible in the marketplace.

| Field                | Type                  | Notes                                                                 |
| -------------------- | --------------------- | --------------------------------------------------------------------- |
| `id`                 | `uuid`                | Primary key.                                                          |
| `slug`               | `text`                | Unique stable URL key for the model page.                             |
| `creator_id`         | `uuid`                | References `profiles.id`. Identifies the uploader or creator.         |
| `category_id`        | `uuid`                | References `categories.id`.                                           |
| `title_ua`           | `text`                | Model title in Ukrainian.                                             |
| `title_en`           | `text`                | Model title in English.                                               |
| `description_ua`     | `text \| null`        | Ukrainian description.                                                |
| `description_en`     | `text \| null`        | English description.                                                  |
| `cover_image_path`   | `text`                | Main image used in the catalog card and hero area.                    |
| `preview_model_path` | `text \| null`        | Optional lightweight 3D preview asset for the model detail page.      |
| `status`             | `model_status`        | Publication status enum: `draft`, `published`, `archived`.            |
| `minimum_plan`       | `plan_key`            | Minimum plan required to download the model: `free`, `pro`, or `max`. |
| `file_format`        | `text \| null`        | Primary display format for UI summaries, for example `glb` or `fbx`.  |
| `file_size_bytes`    | `bigint \| null`      | Size of the primary downloadable file for quick UI display.           |
| `polygon_count`      | `integer \| null`     | Optional technical metadata for the asset page.                       |
| `download_count`     | `integer`             | Cached counter for popularity display.                                |
| `is_featured`        | `boolean`             | Whether the model can appear in featured UI sections.                 |
| `created_at`         | `timestamptz`         | Creation timestamp.                                                   |
| `updated_at`         | `timestamptz`         | Last update timestamp.                                                |
| `published_at`       | `timestamptz \| null` | When the model became publicly visible.                               |

### Notes

- `cover_image_path` is stored directly on `models` because MVP only needs one primary image per model.
- `preview_model_path` is intentionally separate from downloadable files so the product can use a lighter preview asset on the detail page.
- Catalog pages should use only the image preview, not the live 3D asset.
- Uploaded cover images are stored in the public `model-images` bucket.
- Downloadable source files and optional lightweight 3D previews are stored in the private `models` bucket.
- The current upload MVP publishes successful uploads immediately; `draft` remains a schema-supported status for a future moderation or review workflow.

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

| Field        | Type          | Notes                       |
| ------------ | ------------- | --------------------------- |
| `id`         | `uuid`        | Primary key.                |
| `user_id`    | `uuid`        | References `profiles.id`.   |
| `model_id`   | `uuid`        | References `models.id`.     |
| `created_at` | `timestamptz` | When the download happened. |

### Notes

- This table is the source for the user library in MVP.
- The library can be built by grouping downloaded models by user.
- This table also supports monthly quota calculations and popularity metrics.

## Relationships

- `profiles.id` -> `auth.users.id`
- `models.creator_id` -> `profiles.id`
- `models.category_id` -> `categories.id`
- `model_files.model_id` -> `models.id`
- `favorites.user_id` -> `profiles.id`
- `favorites.model_id` -> `models.id`
- `downloads.user_id` -> `profiles.id`
- `downloads.model_id` -> `models.id`

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
