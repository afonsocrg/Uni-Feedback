# Runtime Environment Variables

This document explains how environment variables are handled in the website-ssr application to support Docker deployments across multiple environments (dev, staging, production).

## Problem

Vite's `import.meta.env` variables are replaced at build time, which means:
- Variables are "baked into" the JavaScript bundle during Docker build
- Cannot change environment variables without rebuilding the Docker image
- Same image cannot be used across different environments

## Solution: Runtime Injection via SSR

We leverage React Router 7's SSR capabilities to inject environment variables at runtime:

### How It Works

1. **Server-side (Node.js runtime)**:
   - Server reads `process.env.VITE_API_BASE_URL` from Docker environment
   - In `app/root.tsx`, the Layout component injects a `<script>` tag into HTML
   - Script sets `window.ENV = { API_BASE_URL: '...' }`

2. **Client-side (Browser)**:
   - JavaScript reads from `window.ENV.API_BASE_URL`
   - Falls back to build-time values if not available

3. **API Client (`packages/api-client/src/config.ts`)**:
   - Checks multiple sources in priority order:
     1. `window.ENV.API_BASE_URL` (client runtime)
     2. `process.env.VITE_API_BASE_URL` (server runtime)
     3. `import.meta.env.VITE_API_BASE_URL` (build time)
     4. `http://localhost:3001` (development fallback)

## Configuration

### Development (.env)
```bash
VITE_API_BASE_URL="http://localhost:3001"
```

### Docker (.env.prod)
```bash
VITE_API_BASE_URL="http://api:3001"
```

### Production
```bash
VITE_API_BASE_URL="https://api.yourdomain.com"
```

## Benefits

✅ **Single Docker image** - Build once, deploy everywhere
✅ **SSR-compatible** - Works seamlessly with server-side rendering
✅ **No shell scripts** - Clean implementation using React Router patterns
✅ **Type-safe** - TypeScript definitions in `env.d.ts`
✅ **Runtime flexibility** - Change API endpoint without rebuilding

## Docker Deployment

The `docker-compose.yml` loads environment variables via `env_file`:

```yaml
website-ssr:
  env_file:
    - apps/website-ssr/.env.prod
```

These variables are available as `process.env` in Node.js and get injected into the HTML for client-side access.

## Security Note

This approach is suitable for **public configuration** like API endpoints (which are visible in browser network requests anyway). For secrets, use:
- Backend proxy pattern (secrets stay on server)
- Docker secrets (for sensitive config)
- Never expose API keys or passwords to the frontend
