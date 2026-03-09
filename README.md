# CloutIQ Frontend

Admin dashboard built with Next.js 16, shadcn/ui, Tailwind CSS v4, and TypeScript.

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router)
- **Language** — [TypeScript](https://www.typescriptlang.org) (strict mode)
- **Auth** — [Clerk](https://clerk.com) (with Organizations & Billing)
- **Error Tracking** — [Sentry](https://sentry.io)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **Components** — [shadcn/ui](https://ui.shadcn.com)
- **State Management** — [Zustand](https://zustand-demo.pmnd.rs)
- **URL State** — [Nuqs](https://nuqs.47ng.com/)
- **Tables** — [TanStack Data Tables](https://tanstack.com/table)
- **Forms** — [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)
- **Command Palette** — [kbar](https://kbar.vercel.app/)
- **Themes** — 6 built-in themes via [tweakcn](https://tweakcn.com/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (preferred) or Node.js
- Git

### Setup

```bash
# Clone the repo
git clone https://github.com/Cloutiq/frontend.git
cd frontend

# Install dependencies
bun install

# Set up environment variables
cp env.example.txt .env.local
# Edit .env.local with your Clerk and Sentry keys

# Start dev server
bun run dev
```

The app will be available at http://localhost:3000.

> **Note:** Clerk supports "keyless mode" — the app works without API keys for initial development.

### Environment Variables

See `env.example.txt` for all required variables. For Clerk setup details (organizations, billing, teams), see [docs/clerk_setup.md](./docs/clerk_setup.md).

## Development Commands

```bash
bun run dev              # Dev server
bun run build            # Production build
bun run start            # Production server
bun run lint             # Run ESLint
bun run lint:fix         # Fix lint issues + format
bun run lint:strict      # Zero warnings mode
bun run format           # Format with Prettier
bun run format:check     # Check formatting
```

## Project Structure

```
src/
├── app/                 # Next.js App Router (routes)
│   ├── auth/            # Sign-in / Sign-up
│   └── dashboard/       # Dashboard routes (overview, products, kanban, etc.)
├── components/          # Shared components
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Layout (sidebar, header, providers)
├── features/            # Feature-based modules
│   ├── overview/        # Dashboard analytics
│   ├── products/        # Product management
│   ├── kanban/          # Kanban board (dnd-kit + Zustand)
│   └── profile/         # User profile
├── config/              # Nav config with RBAC
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (cn, data-table helpers, parsers)
├── styles/              # Global CSS + 6 theme files
└── types/               # TypeScript types
```

## Features

- Admin dashboard layout (sidebar, header, content area)
- Analytics overview with Recharts (parallel routes for independent loading)
- Data tables with server-side search, filter, and pagination
- Authentication & user management via Clerk
- Multi-tenant workspaces with Clerk Organizations
- Billing & subscriptions with Clerk Billing (B2B)
- RBAC navigation filtering (org, permissions, roles, plans)
- Kanban board with drag-and-drop (dnd-kit + Zustand)
- Multi-theme support with easy switching
- Feature-based folder structure

## Documentation

- [Clerk Setup Guide](./docs/clerk_setup.md)
- [Navigation RBAC](./docs/nav-rbac.md)
- [Theme Customization](./docs/themes.md)
- [Cleanup Guide](./__CLEANUP__/cleanup.md) — remove demo data or unwanted features

## Based On

This project is based on [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) by Kiranism.
