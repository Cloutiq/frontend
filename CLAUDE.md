# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CloutIQ frontend — a Next.js 16 (App Router) admin dashboard with TypeScript 5.7 (strict), Tailwind CSS v4, shadcn/ui (New York style), Clerk auth, and Sentry error tracking.

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Dev server at http://localhost:3000
bun run build            # Production build
bun run lint             # ESLint
bun run lint:fix         # ESLint fix + Prettier format
bun run lint:strict      # Zero warnings
bun run format           # Prettier format all
npx shadcn add <name>    # Add a shadcn component
```

No test suite is configured.

## Architecture

- **App Router**: `src/app/` — routes including `dashboard/` (with parallel routes for overview stats), `auth/`, landing pages
- **Features**: `src/features/` — feature-based modules (auth, overview, products, kanban, profile), each with `components/`, `utils/`, `schemas/`
- **Shared UI**: `src/components/ui/` — 59 shadcn components (do not modify directly; extend instead)
- **Layout**: `src/components/layout/` — sidebar, header, providers (Clerk + theme)
- **Config**: `src/config/nav-config.ts` — centralized navigation with RBAC access controls
- **State**: Zustand for global state, Nuqs for URL params, React Hook Form + Zod for forms
- **Themes**: 6 themes in `src/styles/themes/`, configured via `src/components/themes/theme.config.ts`, cookie-persisted
- **Mock data**: `src/constants/mock-api.ts` (Faker.js) — no real API layer yet

## Key Conventions

- **Path alias**: `@/*` maps to `src/*`
- **Server components by default** — only add `'use client'` when using browser APIs or hooks
- **Function declarations** for components: `function ComponentName() {}`
- **Props**: interface named `{ComponentName}Props`
- **Class merging**: always use `cn()` from `@/lib/utils`, never manual string concatenation
- **Formatting**: single quotes, no trailing commas, 2-space indent, semicolons (Prettier with tailwind plugin)
- **Imports**: `@typescript-eslint/no-unused-vars` warns, `no-console` warns

## Auth (Clerk)

- Clerk with Organizations + Billing for multi-tenancy
- Supports "keyless mode" for development without API keys
- Server-side: `auth()` + `has()` for permission checks
- Client-side: `<Protect>` component, `useOrganization()`, `useUser()`
- RBAC nav filtering via `useFilteredNavItems()` hook in `src/hooks/use-nav.ts` (UX only; enforce server-side)

## Adding a New Feature

1. Create route in `src/app/dashboard/<feature>/page.tsx`
2. Add feature module in `src/features/<feature>/`
3. Add nav item in `src/config/nav-config.ts`

## Reference

See `AGENTS.md` for detailed architecture docs, `docs/` for Clerk setup, RBAC, and theming guides.
