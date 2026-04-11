# Project Context

## What Threedly Is

Threedly is a 3D model marketplace for designers, 3D visualizers, and studios. The platform is being designed for Ukrainian and English-speaking audiences and aims to deliver a much more modern visual experience than older catalog-style competitors.

The product combines two ideas:

- a searchable marketplace for downloading 3D assets;
- a subscription business model that controls access, downloads, and creator capabilities.

## Product Positioning

Reference point:

- the structural inspiration is similar to marketplaces like `3ddd`;
- the visual execution should be significantly more modern, premium, and animation-rich;
- the audience is design-sensitive, so UI quality is a product requirement, not decoration.

## Audience

- interior designers
- 3D visualizers
- archviz studios
- freelancers assembling scenes quickly
- creators who want to upload and distribute their own models

## Business Model Direction

### Free

- limited monthly downloads
- intended for exploration and light use

### Pro

- more monthly downloads
- can upload personal models to the marketplace
- intended for active professionals and creators

### Max

- highest monthly download allowance
- intended for power users and heavier production use

Implementation details can change, but code and UX decisions should be compatible with this plan structure.

## Product Priorities

1. Make discovery simple and visually satisfying.
2. Build trust through clean UX, quality presentation, and multilingual accessibility.
3. Support both consumers of models and creators uploading content.
4. Keep the UI premium and memorable.
5. Grow toward a full marketplace, not only a landing page.

## Current State In Repo

Already implemented:

- localized app shell with `ua` and `en`
- marketing home page
- pricing page
- auth flow via Supabase
- profile dashboard shell
- avatar uploads
- shared design system primitives
- theme handling

Not implemented yet or still early:

- catalog browsing
- categories
- designer profile directory
- model detail pages
- subscription billing
- download quota logic
- creator upload workflow for marketplace models
- moderation/admin flows
- asset storage strategy for large model files

## Visual Direction

The site should feel:

- editorial, not template-like;
- expressive, not flat;
- premium, not overly corporate;
- interactive, but still fast and readable.

Animation libraries like `motion`, `gsap`, and future `three` usage should support the experience, not distract from content.

## Important Product Constraint

Do not invent marketplace features in code or copy as if they already exist. When working inside the current codebase, distinguish clearly between:

- what is already implemented;
- what is product direction;
- what is roadmap or placeholder content.
