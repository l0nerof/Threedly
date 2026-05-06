# Threedly Agent Guide

## Product Context

Threedly is a modern 3D model marketplace for designers, 3D visualizers, and studios. It targets Ukrainian and English-speaking users and should feel more premium, stylish, and interactive than older catalog-style competitors.

Current product direction:

- `Free`: limited monthly downloads.
- `Pro`: higher download quota and creator uploads.
- `Max`: highest download quota.

Treat this as product direction, not proof that every feature already exists in code.

## Current Codebase Reality

The repo already includes:

- localized marketing pages;
- pricing page;
- auth flows with Supabase;
- profile area;
- avatar uploads;
- theme support and shared UI primitives.

The repo does not yet fully implement the marketplace core. Features like catalog, model pages, subscriptions, download quotas, and creator upload workflows are planned but still incomplete or absent.

## Architecture

- `src/app`: routes, layouts, metadata, route-level server actions
- `src/business`: product-specific components, constants, schemas, providers, Supabase utilities
- `src/shared`: reusable primitives, hooks, utilities, generic types
- `messages/*.json`: localization dictionaries

Keep this layering intact when adding new code.

## UI Expectations

The audience is visually demanding. Avoid generic SaaS-looking output.

- Favor polished, intentional layouts.
- Keep motion purposeful and restrained.
- Use the existing design tokens and shared components first.
- Maintain strong desktop and mobile experiences.
- Do not flatten the product into a boring dashboard aesthetic.

## Working Rules

- Always respond in Ukrainian unless the task explicitly requires another language.
- Optimize for the smallest possible diff that solves the task.
- Avoid cosmetic edits, mass renames, formatting-only passes, or repo-wide cleanup unless explicitly requested.
- Before substantial changes, first outline a short plan, list the files to be changed, and surface any blocking assumptions or questions.
- Preserve locale-aware routing with `next-intl`.
- Preserve the `ua` and `en` bilingual direction.
- Preserve existing behavior unless the task explicitly changes it.
- Do not invent APIs, schema fields, endpoints, database tables, or response contracts.
- Follow the existing repo structure, naming, and implementation patterns before introducing new ones.
- Prefer `zod` and existing schema/form patterns for validation.
- Never use `any`. `unknown` is allowed only at external boundaries and must be narrowed before use.
- Reuse existing Supabase helpers in `src/business/utils/supabase`.
- Prefer ready-made, maintained building blocks over ad hoc implementations when they fit the need.
- For UI primitives and common interaction patterns, prefer existing `shadcn/ui` components first.
- If a suitable `shadcn` component is missing but clearly fits the task, add/install it instead of writing a custom replacement from scratch.
- Only build custom UI behavior when existing `shadcn`, shared, or business-layer components cannot reasonably support the requirement.
- Do not invent storage or billing architecture as if it already exists unless the task is explicitly to design or implement it.
- Distinguish clearly between implemented behavior and roadmap assumptions.

## UI And Refactoring

- Do not create new architectural layers or folders unless there is a clear need.
- Keep components focused and extract subcomponents/hooks only when it meaningfully reduces complexity.
- Do not keep reusable arrays, step definitions, tab configs, display maps, or similar view configuration inline in large component files without a good reason.
- Move reusable constants, configs, and structured UI data into appropriate files under existing `constants`, `types`, or nearby extracted modules when that improves reuse, readability, or maintainability.
- If logic, data shape, or presentation structure is likely to be reused across routes or components, extract it instead of duplicating or embedding it deeply in one file.
- Prefer standard Tailwind scale values and existing utilities before using arbitrary values like `[]`.
- Use arbitrary values only when the design clearly requires a non-standard value and the existing Tailwind scale or tokens do not cover the need well.
- Do not redesign existing UI or change global styles unless requested.
- Maintain baseline accessibility: semantic markup, labels for icon-only controls, keyboard support, and visible focus behavior.
- Prefer semantic HTML that supports both accessibility and SEO.
- Ensure pages have a clear heading hierarchy and meaningful landmarks.
- Treat metadata, crawlability, and content structure as product concerns, not polish.
- Prefer performant UI choices: avoid unnecessary client-side work, oversized bundles, and heavy animation on critical content.
- Respect reduced-motion needs when adding richer motion or animated effects.
- Refactors should state what is being improved and why the change is safe.

## External Data And Integrations

- Use verified contracts, schemas, examples, or source-of-truth tools when available.
- At boundaries, validate untrusted data before it becomes typed application data.
- Handle error, empty, and loading states explicitly.
- Do not fabricate response fields or undocumented library APIs.

## Testing Expectations

- Preferred stack for this project:
  - `Vitest` + `React Testing Library` for unit/integration tests
  - `Playwright` for end-to-end tests
- Test behavior from the user perspective, not implementation details.
- Minimum expectation for new behavior:
  - happy path
  - 1-2 meaningful edge cases
  - at least one failure state when relevant
- Keep tests deterministic:
  - no real network in unit tests
  - prefer mocked, stubbed, or otherwise controlled boundaries for unit/integration coverage
  - for e2e, use the documented project workflow and keep assertions resilient to environment-specific timing
  - control time/randomness
  - avoid flaky waits
- For Playwright E2E, import `test` and `expect` from `e2e/fixtures`, exercise the real app/browser stack without mocking framework, browser, Supabase, fetch, timer, or third-party UI behavior, and update `e2e/README.md` whenever coverage changes.

## SEO, Accessibility, And Performance

- Prefer server-rendered, indexable content for public marketing and catalog pages when possible.
- Use meaningful metadata, titles, descriptions, and structured heading order.
- Images and visual media should have correct `alt` behavior and not harm Largest Contentful Paint unnecessarily.
- Interactive controls must be reachable by keyboard and have clear accessible names.
- Avoid performance regressions from unnecessary dependencies, excessive client components, and unbounded animation work.
- Build for a premium feel without sacrificing clarity, semantics, or loading performance.

## Quality Gate

- Before finishing meaningful code changes, aim to run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test:unit` for relevant unit coverage
  - `npm run e2e` for relevant end-to-end coverage when applicable
- If checks cannot be run, state that clearly and list the exact commands.

## Docs

For more context, read:

- `README.md`
- `docs/project-context.md`
- `docs/development-guide.md`
- `unit/README.md`
- `e2e/README.md`
