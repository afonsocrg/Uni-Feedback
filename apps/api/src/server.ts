import { router } from '@routes'
import { DatabaseContext } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import { createServerAdapter } from '@whatwg-node/server'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { createServer } from 'node:http'
import postgres from 'postgres'

// Load environment variables
config()

// Global env variable storage (keeping the same pattern as before)
let globalEnv: Env | null = null

// Getter function to access env
export function getEnv(): Env {
  if (!globalEnv) {
    throw new Error('Env not initialized')
  }
  return globalEnv
}

// Create the env object from Node.js environment variables
function createEnv(): Env {
  const requiredVars = ['DATABASE_URL'] as const

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`)
    }
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NODE_ENV:
      (process.env.NODE_ENV as 'development' | 'production') || 'development',
    DASHBOARD_URL: process.env.DASHBOARD_URL || 'localhost:5174',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID
  }
}

// Create a fetch handler that mimics the Cloudflare Workers pattern
const createFetchHandler = () => {
  return async (request: Request): Promise<Response> => {
    try {
      // Initialize env if not already done
      if (!globalEnv) {
        globalEnv = createEnv()
      }

      // Create database connection
      const sql = postgres(globalEnv.DATABASE_URL)
      const db = drizzle(sql, { schema })

      // Run the request within database context (same as before)
      return await DatabaseContext.run(db, async () => {
        return await router.fetch(request, globalEnv, {})
      })
    } catch (error) {
      console.error('Server error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
const fetchHandler = createFetchHandler()

// Create server adapter that converts Node.js requests to Web Requests
const serverAdapter = createServerAdapter(fetchHandler)
const server = createServer(serverAdapter)

server.listen(port, () => {
  console.log(`🚀 API server running at http://localhost:${port}`)
  console.log(`📖 API docs available at http://localhost:${port}/docs`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => process.exit(0))
})
