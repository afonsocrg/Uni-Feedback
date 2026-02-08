declare global {
  type RequestHandler = (
    env: Env,
    req: Request,
    handler?: RequestHandler
  ) => Promise<Response>

  interface Env {
    API_PORT: number
    DATABASE_URL: string
    ALLOWED_ORIGINS: string

    NODE_ENV: 'development' | 'production'

    DASHBOARD_URL: string
    WEBSITE_URL: string

    // Email
    RESEND_API_KEY?: string

    // PostHog
    POSTHOG_API_KEY?: string
    POSTHOG_HOST?: string

    // Telegram
    TELEGRAM_BOT_TOKEN?: string
    TELEGRAM_CHAT_ID?: string

    // AI
    OPENROUTER_API_KEY?: string

    // R2 Storage for PDF Reports
    R2_ACCOUNT_ID?: string
    R2_ACCESS_KEY_ID?: string
    R2_SECRET_ACCESS_KEY?: string
    R2_BUCKET_NAME?: string
    REPORT_TEMPLATE_VERSION?: string

    // Feature flags
    VALIDATE_EMAIL_SUFFIX: boolean
    REQUIRE_FEEDBACK_AUTH: boolean
  }
}

export {}
