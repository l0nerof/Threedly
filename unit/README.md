# Unit Test Coverage

This file documents the Vitest coverage in this repository and should stay in sync with the actual specs.

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
- [x] Reset returns the shell to its default local state
- [x] Initial category from route state appears in the active filter UI

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
- [x] Upload server action removes stored source, preview, and cover files when metadata save fails

## Coverage Map

| Area                 | Source                                                          | Spec                          | Status        |
| -------------------- | --------------------------------------------------------------- | ----------------------------- | ------------- |
| Shared hook          | `src/shared/hooks/use-mobile.ts`                                | `use-mobile.spec.ts`          | `[x] Covered` |
| Catalog UI shell     | `src/app/[locale]/(main-pages)/catalog/components/CatalogShell` | `catalog-shell.spec.tsx`      | `[x] Covered` |
| Model upload helpers | `src/business/utils/modelUpload.ts`                             | `model-upload-utils.spec.ts`  | `[x] Covered` |
| Model upload schema  | `src/business/schemas/modelUpload.ts`                           | `model-upload-schema.spec.ts` | `[x] Covered` |
| Model upload action  | `src/app/[locale]/(main-pages)/profile/uploads/actions.ts`      | `model-upload-action.spec.ts` | `[x] Covered` |

## Known Gaps

- [ ] No shared utility coverage yet
- [ ] Async server components are not covered here and should remain primarily in e2e coverage

## Authoring Notes

- Prefer public behavior over implementation details.
- Keep reusable mocks in `unit/mocks` instead of redefining them inside each spec.
- Use `unit/fixtures` as the single import surface for shared Vitest and Testing Library helpers.
- Keep this file updated whenever a new spec is added, removed, or broadened.
