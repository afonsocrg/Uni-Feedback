# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Uni Feedback is a platform for university students to share anonymous course reviews and ratings. React frontend + Cloudflare Workers backend with D1 database.

## Development Commands

```bash
# Monorepo (run from root)
bun run start      # Start both frontend and backend
bun run build      # Build both applications
bun run format     # Format code (MUST run before commits)

# Frontend (run from /frontend)
bun run dev        # Development server (port 5173)

# Backend (run from /backend)
bun run start      # Start with Wrangler dev
bun run deploy     # Deploy to Cloudflare
bun run db         # Open Drizzle Studio
```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4.x + shadcn/ui
- **Backend**: Cloudflare Workers + Bun + Drizzle ORM
- **Database**: Cloudflare D1 (SQLite)
- **State Management**: TanStack Query

## Project Structure

```
ist-feedback/
├── frontend/          # React application
├── backend/           # Cloudflare Workers API
├── afonsocrg/         # Documentation and project data
├── fenix/             # Data scraping from IST's Fenix
└── lib/               # Shared utilities
```

## Code Patterns

- Use TypeScript strictly throughout
- Follow existing component patterns in `/frontend/src/components/`
- Database queries use Drizzle ORM
- Form validation with React Hook Form + Zod
- API responses follow standardized error handling

## Commit Rules

- **NEVER** include author information in commit messages
- **ALWAYS** run `bun run format` before committing
- Use conventional commit format when possible
