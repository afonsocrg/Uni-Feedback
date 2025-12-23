declare global {
  type RequestHandler = (
    env: Env,
    req: Request,
    handler?: RequestHandler
  ) => Promise<Response>

  interface Env {
    DATABASE_URL: string
    NODE_ENV: 'development' | 'production'
    DASHBOARD_URL: string
    WEBSITE_URL: string
    ALLOWED_ORIGINS: string
    RESEND_API_KEY?: string
    POSTHOG_API_KEY?: string
    POSTHOG_HOST?: string
    TELEGRAM_BOT_TOKEN?: string
    TELEGRAM_CHAT_ID?: string
    VALIDATE_EMAIL_SUFFIX: boolean
    API_PORT: number
  }
}

export {}
