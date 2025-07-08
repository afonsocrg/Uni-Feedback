# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Uni Feedback is a platform for university students to share anonymous course reviews and ratings. The architecture consists of a React frontend and Cloudflare Workers backend with D1 database.

## Development Commands

### Monorepo Commands (run from root)

```bash
bun run start      # Start both frontend and backend
bun run build      # Build both applications
bun run clean      # Clean all node_modules
```

### Frontend Commands (run from /frontend)

```bash
bun run dev        # Development server (port 5173)
bun run build      # Production build
bun run preview    # Preview production build
```

### Backend Commands (run from /backend)

```bash
bun run start      # Start with Wrangler dev
bun run deploy     # Deploy to Cloudflare
bun run db         # Open Drizzle Studio (local)
bun run backup     # Backup database
```

### Database Operations

```bash
bun run db         # Open Drizzle Studio for database management
bun run backup     # Create database backup
```

## Architecture Overview

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4.x + shadcn/ui
- **Backend**: Cloudflare Workers + Bun + Drizzle ORM
- **Database**: Cloudflare D1 (SQLite)
- **State Management**: TanStack Query for server state
- **Deployment**: Cloudflare Pages (frontend) + Cloudflare Workers (backend)

### Project Structure

```
ist-feedback/
├── frontend/          # React application
├── backend/           # Cloudflare Workers API
├── afonsocrg/         # Documentation, notes, and project data
├── fenix/             # Data scraping from IST's Fenix system
├── legacy/            # Legacy markdown course reviews
└── lib/               # Shared utilities
```

### Key Database Entities

- **Courses**: Course information with external IDs and assessments
- **Degrees**: Academic programs (MEIC, MEGE, etc.)
- **Feedback**: Student reviews with ratings and comments
- **Course Groups**: Degree specializations
- Many-to-many relationships between courses and degrees

### API Architecture

- RESTful API with OpenAPI documentation via Chanfana
- Modular route structure in `/backend/src/routes/`
- Database schema in `/backend/src/db/schema.ts`
- Migrations managed by Drizzle ORM

### Frontend Architecture

- Component-based with atomic design principles
- Custom hooks for API calls in `/frontend/src/hooks/`
- React Query for server state management
- Form validation with React Hook Form + Zod
- Responsive design with mobile-first approach

## Development Workflow

### Local Development Setup

1. Install dependencies: `bun install`
2. Set up Cloudflare D1 database
3. Configure environment variables
4. Run database migrations
5. Start development servers: `bun run start`

### Deployment

- **Frontend**: Deploy via `/frontend/push_to_prod.sh` script (pushes to prod branch)
- **Backend**: Deploy via `bun run deploy` from backend directory
- **Domain**: https://istfeedback.com

### Data Management

- Fenix scraper in `/fenix/` directory updates course data
- Admin notifications via Telegram bot integration
- Database backups automated via scripts

## Important Notes

### External Dependencies

- Requires Cloudflare account for D1 database and Workers
- Uses Bun as primary runtime (Node.js for some tooling)
- PostHog integration for analytics

### Code Patterns

- Use TypeScript strictly throughout
- Follow existing component patterns in `/frontend/src/components/`
- Database queries should use Drizzle ORM
- API responses follow standardized error handling
- Form validation must use Zod schemas

### Testing & Quality

- No specific test framework currently configured
- Code quality maintained through TypeScript strict mode
- CORS properly configured for cross-origin requests

### Documentation

- Project TODO list maintained in `/afonsocrg/todo.md`
- Backend API documentation auto-generated via Chanfana
- Extensive notes in `/afonsocrg/notes/` directory
