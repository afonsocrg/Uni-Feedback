import { config } from 'dotenv'

// Load environment variables once, as early as possible
config()

export function getAllowedOrigins():
  | string[]
  | ((origin: string) => string | null) {
  if (process.env.NODE_ENV !== 'production') {
    return (origin: string) => origin
  }
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}
