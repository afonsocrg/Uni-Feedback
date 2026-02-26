# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Uni Feedback is a platform for university students to share anonymous course reviews and ratings. This is a **Turborepo monorepo** with React Router 7 (Remix successor) frontend + Node.js/Express backend + PostgreSQL database.

## Development Commands

```bash
# Monorepo (run from root) - Uses Turborepo
pnpm run dev        # Start all development servers in parallel
pnpm run build      # Build all applications and packages
pnpm run format     # Format code (MUST run before commits)
pnpm run lint       # Lint all packages
pnpm run type-check # Type check all packages

# Website SSR (run from /apps/website-ssr)
pnpm run dev        # Development server with React Router + Express
pnpm run build      # Build website for production
pnpm run start      # Start production server

# Admin Dashboard (run from /apps/dashboard)
pnpm run dev        # Development server (port 5174)
pnpm run build      # Build dashboard

# API (run from /apps/api)
pnpm run dev        # Start Express development server
pnpm run build      # Build API for production
pnpm run start      # Start production server
```

## Tech Stack

- **Monorepo**: Turborepo with pnpm workspaces
- **Frontend**: React 19 + React Router 7 + TypeScript + TailwindCSS 4.x + shadcn/ui
- **Backend**: Node.js + Express + Drizzle ORM + Puppeteer
- **Database**: PostgreSQL
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
│   ├── website-ssr/               # Main student-facing website (React Router 7 + SSR)
│   │   ├── app/
│   │   │   ├── routes/           # React Router routes
│   │   │   ├── components/       # Website-specific components
│   │   │   └── root.tsx          # Root layout
│   │   ├── server.js             # Express server
│   │   └── package.json          # Website dependencies
│   │
│   ├── dashboard/                 # Admin dashboard application
│   │   ├── src/
│   │   │   ├── pages/            # Dashboard-specific pages
│   │   │   ├── components/       # Dashboard-specific components
│   │   │   └── main.tsx          # Dashboard entry point
│   │   ├── package.json          # Dashboard dependencies
│   │   └── vite.config.ts        # Dashboard build config
│   │
│   └── api/                       # Node.js/Express backend
│       ├── src/
│       │   ├── server.ts         # Express server
│       │   └── routes/           # API routes
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
- Database queries use Drizzle ORM with PostgreSQL
- Server-side image generation uses Puppeteer (already set up)
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

## Environment Variables

**Simple approach:** Each app has its own `.env` file with everything it needs.

**Setup:**
```bash
cp apps/api/.env.example apps/api/.env
cp apps/website-ssr/.env.example apps/website-ssr/.env
# Update DATABASE_URL password in both files
```

## Commit Rules

- **NEVER** include author information in commit messages
- **ALWAYS** run `pnpm run format` before committing
- Use conventional commit format when possible
- Always use pnpm