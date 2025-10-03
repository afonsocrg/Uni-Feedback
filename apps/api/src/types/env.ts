export interface Env {
  DATABASE_URL: string
  WORKER_ENV: string
  DASHBOARD_URL: string
  RESEND_API_KEY?: string
  POSTHOG_API_KEY?: string
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
  FORCE_SEND_EMAIL?: boolean
  DEV_MODE?: boolean
}
