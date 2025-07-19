import { D1Database } from '@cloudflare/workers-types'

declare global {
  type RequestHandler = (
    env: Env,
    req: Request,
    handler?: RequestHandler
  ) => Promise<Response>

  interface Env {
    DEV_MODE: string
    DB: D1Database
    WORKER_ENV: string
    RESEND_API_KEY: string
    FORCE_SEND_EMAIL?: string
    POSTHOG_API_KEY: string
    POSTHOG_HOST: string
    TELEGRAM_BOT_TOKEN: string
    TELEGRAM_CHAT_ID: string
  }
}

export {}
