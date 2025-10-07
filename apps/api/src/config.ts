import { config } from 'dotenv'

// Load environment variables once, as early as possible
config()

export function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}
