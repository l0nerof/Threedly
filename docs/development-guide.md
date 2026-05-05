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
npm run build
npm run start
npm run e2e:install
npm run e2e
npm run e2e:headed
npm run e2e:ui
npm run test:unit
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

Recommended workflow:

- keep the real Supabase project credentials in `.env.local`
- use `npm run dev` for local frontend + local Supabase
- use `npm run dev:remote` when you want the frontend to talk to the real Supabase project
- use `npm run db:start`, `npm run db:reset`, and `npm run db:seed` only for the local Supabase stack
- use `npm run db:start` to boot local Supabase containers before `npm run db:seed`

How local mode works:

- `npm run dev` starts local Supabase if needed and ensures the local demo user exists
- the wrapper injects the local URL and publishable key directly into the `next dev` process
- `.env.local` is not rewritten during local startup
- Supabase Studio is available at `http://127.0.0.1:55323`
- local demo user credentials are written to `.env.demo-user.local` and kept in sync with the local auth seed
- `.env.remote.local` and `.env.supabase.local` are no longer part of the workflow

Local DB command behavior:

- `npm run db:start` starts the local Supabase stack and syncs the demo auth user
- `npm run db:reset` removes local Supabase containers and data volumes, starts a fresh stack, reapplies migrations and SQL seeds, then runs the demo-user post-seed
- `npm run db:seed` reapplies SQL seeds and demo-user post-seed against an already running local stack
- `npm run db:seed` should fail fast if local Supabase is not running instead of starting Docker automatically

These values are used by:

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
