// Runtime environment variable support for Docker/SSR
// Priority: window.ENV (client runtime) → process.env (server runtime) → import.meta.env (build time)
export const API_BASE_URL = (() => {
  // Client-side runtime (injected by SSR)
  if (typeof window !== 'undefined' && (window as any).ENV?.API_BASE_URL) {
    return (window as any).ENV.API_BASE_URL
  }

  // Server-side runtime (Docker env vars) - use globalThis to avoid process type issues
  if (
    typeof globalThis !== 'undefined' &&
    (globalThis as any).process?.env?.VITE_API_BASE_URL
  ) {
    return (globalThis as any).process.env.VITE_API_BASE_URL
  }

  // Build-time fallback (Vite)
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_API_BASE_URL
  ) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // Development fallback
  return 'http://localhost:3001'
})()
