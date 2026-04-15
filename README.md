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

By default, `npm run dev` starts the local Supabase stack and runs the frontend against the local database.

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
npm run lint
npm run typecheck
npm run format
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values for your environment.

Keep the real Supabase project credentials in `.env.local`.

When you run `npm run dev`, the local wrapper injects local Supabase credentials into the current `next dev` process without rewriting `.env.local`. When you need the real project, use `npm run dev:remote`.

Local helper files created during development:

- `.env.demo-user.local` stores the seeded demo user credentials for the local database
- `.env.local` should remain your remote/default Supabase configuration

There is no need to keep `.env.remote.local` or `.env.supabase.local` anymore. The local workflow now injects local credentials only into the current dev process.

Local Supabase URLs:

- Studio: `http://127.0.0.1:54323`
- API: `http://127.0.0.1:54321`
- Postgres: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Environment values are used by the browser, server, and session proxy helpers in `src/business/utils/supabase/*`.

## Product Docs

More context lives here:

- [Project Context](docs/project-context.md)
- [Development Guide](docs/development-guide.md)
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
