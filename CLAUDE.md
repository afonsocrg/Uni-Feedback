# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Uni Feedback is a platform for university students to share anonymous course reviews and ratings. This is a **Turborepo monorepo** with React frontends + Cloudflare Workers backend with D1 database.

## Development Commands

```bash
# Monorepo (run from root) - Uses Turborepo
bun run dev        # Start all development servers in parallel
bun run build      # Build all applications and packages
bun run format     # Format code (MUST run before commits)
bun run lint       # Lint all packages
bun run type-check # Type check all packages

# Website (run from /apps/website)
bun run dev        # Development server (port 5173)
bun run build      # Build website

# Admin Dashboard (run from /apps/dashboard)
bun run dev        # Development server (port 5174)
bun run build      # Build dashboard

# API (run from /apps/api)
bun run dev        # Start with Wrangler dev
bun run deploy     # Deploy to Cloudflare
bun run db         # Open Drizzle Studio
```

## Tech Stack

- **Monorepo**: Turborepo with Bun workspaces
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4.x + shadcn/ui
- **Backend**: Cloudflare Workers + Bun + Drizzle ORM
- **Database**: Cloudflare D1 (SQLite)
- **State Management**: TanStack Query
- **Shared Packages**: Internal workspace packages for UI, API client, and utilities

## Project Structure

```
uni-feedback/
├── package.json                    # Root workspace config with Turborepo
├── turbo.json                     # Turborepo pipeline configuration
├── tsconfig.json                  # Shared TypeScript config
│
├── apps/                          # Application-specific code
│   ├── website/                   # Main student-facing website
│   │   ├── src/
│   │   │   ├── pages/            # Website-specific pages/routes
│   │   │   ├── components/       # Website-specific components
│   │   │   ├── context/          # App context providers
│   │   │   ├── hooks/            # Website-specific hooks
│   │   │   └── main.tsx          # Website entry point
│   │   ├── package.json          # Website dependencies
│   │   └── vite.config.ts        # Website build config
│   │
│   ├── dashboard/                 # Admin dashboard application
│   │   ├── src/
│   │   │   ├── pages/            # Dashboard-specific pages
│   │   │   ├── components/       # Dashboard-specific components
│   │   │   └── main.tsx          # Dashboard entry point
│   │   ├── package.json          # Dashboard dependencies
│   │   └── vite.config.ts        # Dashboard build config
│   │
│   └── api/                       # Cloudflare Workers backend
│       ├── src/
│       └── package.json
│
├── packages/                      # Shared reusable code
│   ├── ui/                        # Reusable UI components
│   │   ├── src/
│   │   │   ├── components/       # shadcn/ui components
│   │   │   ├── utils/            # UI utilities (cn, etc.)
│   │   │   └── index.ts          # Package exports
│   │   └── package.json          # "@uni-feedback/ui"
│   │
│   ├── api-client/                # API service functions
│   │   ├── src/
│   │   │   ├── courses.ts        # Course API calls
│   │   │   ├── feedback.ts       # Feedback API calls
│   │   │   ├── types.ts          # Shared API types
│   │   │   └── index.ts          # Package exports
│   │   └── package.json          # "@uni-feedback/api-client"
│   │
│   └── utils/                     # Shared utility functions
│       ├── src/
│       │   ├── schoolYear.ts     # School year utilities
│       │   └── index.ts          # Package exports
│       └── package.json          # "@uni-feedback/utils"
```

## Code Patterns

- Use TypeScript strictly throughout
- Follow existing component patterns in shared UI package: `packages/ui/src/components/`
- Import shared packages using workspace names: `@uni-feedback/ui`, `@uni-feedback/api-client`, `@uni-feedback/utils`
- Database queries use Drizzle ORM in the API
- Form validation with React Hook Form + Zod
- API responses follow standardized error handling

## Shared Package Usage

```typescript
// Import UI components
import { Button, Card, Dialog } from '@uni-feedback/ui'

// Import API client functions
import { getCourses, submitFeedback } from '@uni-feedback/api-client'

// Import utilities
import {
  getCurrentSchoolYear,
  formatSchoolYearString
} from '@uni-feedback/utils'
```

## Commit Rules

- **NEVER** include author information in commit messages
- **ALWAYS** run `bun run format` before committing
- Use conventional commit format when possible
