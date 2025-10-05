/// <reference types="vite/client" />

// Runtime environment variables injected by SSR
interface RuntimeEnv {
  API_BASE_URL: string
}

declare global {
  interface Window {
    ENV?: RuntimeEnv
  }
}

export {}
