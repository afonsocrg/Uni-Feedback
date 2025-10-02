declare global {
  type RequestHandler = (
    env: Env,
    req: Request,
    handler?: RequestHandler
  ) => Promise<Response>

  interface Env {
    DATABASE_URL: string
    WORKER_ENV: string
    DASHBOARD_URL: string
    RESEND_API_KEY?: string
    SEND_EMAILS_IN_DEV?: string
    FORCE_SEND_EMAIL?: string
    POSTHOG_API_KEY?: string
    POSTHOG_HOST?: string
    TELEGRAM_BOT_TOKEN?: string
    TELEGRAM_CHAT_ID?: string
  }
}

export {}
