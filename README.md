# Threedly

Threedly is a modern marketplace for 3D models aimed at interior designers, 3D visualizers, and studios working in Ukrainian and English. The product direction is inspired by platforms like `3ddd`, but with a more polished visual language, better UX, multilingual support, and a subscription-based business model.

The repository already contains the first application foundation: localized marketing pages, authentication, pricing, user profile area, theme support, and Supabase integration.

## Product Vision

Threedly is being built as a stylish, design-forward platform where professionals can:

- discover high-quality 3D models;
- manage a personal library of downloaded assets;
- upload their own models on eligible plans;
- work in both Ukrainian and English;
- use a product that feels premium, modern, and visually expressive.

### Subscription Direction

- `Free`: limited number of downloads per month.
- `Pro`: higher download limit and ability to upload your own models.
- `Max`: highest download allowance for power users and teams.

The exact commercial rules can evolve, but this is the current business framing the codebase should support.

## Current Stack

- `Next.js 16` with App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `shadcn/ui`
- `Supabase` for auth and application data
- `next-intl` for localization
- `motion` and `gsap` for animation
- `three` for future 3D/immersive interactions
- `zod`, `react-hook-form`, `lucide-react`

Notes:

- `react-bits` and `Aceternity UI` are part of the intended UI toolkit direction, although the current dependency list reflects the code already installed in the repo.
- Supabase currently handles authentication and profile-related data/storage flows. Final storage strategy for large 3D model files is still open.

## What Exists Today

The app is already structured around a real product shell instead of a starter template:

- localized home page under `src/app/[locale]/(main-pages)/page.tsx`
- pricing page and FAQ
- login, signup, and email verification flow with Supabase
- profile area with overview, library, uploads, and settings routes
- avatar upload flow via Supabase Storage
- theme system and shared UI component layer
- animated marketing components and custom visual sections

## Project Structure

```text
src/
  app/                  App Router pages, layouts, route groups, server actions
  business/             Product-level components, constants, schemas, providers, utils
  i18n/                 next-intl routing and request config
  shared/               Reusable UI primitives, hooks, utilities, cross-cutting types
messages/               Locale dictionaries (`en.json`, `ua.json`)
public/                 Static assets
docs/                   Product and development documentation
```

### Layering Intent

- `shared/` is for reusable primitives and generic helpers.
- `business/` is for product-specific logic and composed components.
- `app/` wires routes, layouts, metadata, and server actions together.

## Local Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

By default, `npm run dev` starts the local Supabase stack, ensures the local demo user exists, and runs the frontend against the local database.

To run the frontend against the real Supabase project instead, keep your real project credentials in `.env.local` and use:

```bash
npm run dev:remote
```

Useful scripts:

```bash
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

Local database workflow:

- `npm run db:start` starts the local Supabase stack and syncs the local demo user.
- `npm run db:reset` removes the local Supabase containers and data volumes, starts a fresh stack, reapplies migrations and seeds, then exits.
- `npm run db:seed` reapplies seed data to an already running local Supabase stack and does not start Docker containers for you.

## Unit Testing

The repository now includes a `Vitest` setup for unit tests under `unit/`.

Quick start:

```bash
npm run test:unit
```

Notes:

- The setup follows the current Next.js `Vitest` guidance with `@vitejs/plugin-react` and `jsdom`.
- Path aliases are resolved through Vite's native `tsconfig` paths support.
- Unit tests live under `unit/` and follow a `fixtures -> mocks -> tests` structure similar to the e2e setup.
- The first unit smoke covers the `useIsMobile` hook and verifies desktop/mobile behavior through a reusable `matchMedia` mock.
- Async server components are still better covered with e2e tests.
- Coverage tracking and known gaps live in `unit/README.md` and should be kept in sync with the actual specs.

More details live in [unit/README.md](unit/README.md).

## End-To-End Testing

The repository now includes a Playwright setup for e2e coverage under `e2e/`.

Quick start:

```bash
npm run e2e:install
npm run e2e
```

Notes:

- Playwright is configured to start the app in remote Supabase mode through `node ./scripts/local-supabase.mjs dev --remote`.
- Keep valid remote Supabase credentials in `.env.local` for the built-in web server flow.
- Playwright runs with `uk-UA` locale so locale-aware smoke tests stay deterministic.
- If you already have the app running on `http://localhost:3000`, Playwright will reuse the existing server automatically.
- The first smoke test covers the default locale redirect and navigation from the home page to pricing.
- Coverage tracking and known gaps live in `e2e/README.md` and should be kept in sync with the actual specs.

More details live in [e2e/README.md](e2e/README.md).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values for your environment.

Keep the real Supabase project credentials in `.env.local`.

When you run `npm run dev`, the local wrapper injects local Supabase credentials into the current `next dev` process without rewriting `.env.local`. When you need the real project, use `npm run dev:remote`.

Local helper files created during development:

- `.env.demo-user.local` stores the local demo user credentials used by the wrapper and local database
- `.env.local` should remain your remote/default Supabase configuration

There is no need to keep `.env.remote.local` or `.env.supabase.local` anymore. The local workflow now injects local credentials only into the current dev process.

Local Supabase URLs:

- Studio: `http://127.0.0.1:55323`
- API: `http://127.0.0.1:55321`
- Postgres: `postgresql://postgres:postgres@127.0.0.1:55322/postgres`

Environment values are used by the browser, server, and session proxy helpers in `src/business/utils/supabase/*`.

## Product Docs

More context lives here:

- [Project Context](docs/project-context.md)
- [Development Guide](docs/development-guide.md)
- [Unit Testing Guide](unit/README.md)
- [E2E Testing Guide](e2e/README.md)
- [Agent Rules](AGENTS.md)

## Implementation Notes

- Default locale is Ukrainian (`ua`), with English (`en`) also supported.
- Middleware/proxy combines `next-intl` locale handling with Supabase session refresh.
- Current pricing constants are still placeholder keys, so future product work should align code and copy with the real subscription model.
- The package metadata still contains an early placeholder name in `package.json`; the product name throughout docs and UI should be treated as `Threedly`.

## Roadmap Themes

Likely next major product areas:

- catalog and category browsing
- model detail pages
- search and filtering
- downloads and quota enforcement
- subscriptions and billing
- creator uploads and moderation
- favorites, collections, and richer user dashboards

## Working Principle

This project should not feel like a generic SaaS dashboard. The visual bar is intentionally higher because the audience is made of designers and visual professionals. New UI work should preserve that direction with strong composition, refined typography, deliberate animation, and premium-feeling interaction design.
