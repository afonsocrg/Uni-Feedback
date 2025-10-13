// Load environment variables via config module
import './config'

import { router } from '@routes'
import { DatabaseContext } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import { createServerAdapter } from '@whatwg-node/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import { createServer } from 'node:http'
import postgres from 'postgres'

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

// Create a single connection pool that will be reused
let sql: ReturnType<typeof postgres> | null = null
let db: ReturnType<typeof drizzle> | null = null

// Initialize the database connection pool
function initializeDatabase() {
  if (!globalEnv) {
    globalEnv = createEnv()
  }

  if (!sql) {
    // Create connection pool with proper configuration
    sql = postgres(globalEnv.DATABASE_URL, {
      max: 10, // Maximum pool size
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout in seconds
    })
    db = drizzle(sql, { schema })
    console.log('✅ Database connection pool initialized')
  }

  return db!
}

// Create a fetch handler that mimics the Cloudflare Workers pattern
const createFetchHandler = () => {
  return async (request: Request): Promise<Response> => {
    try {
      // Initialize database pool (only happens once)
      const database = initializeDatabase()

      // Run the request within database context
      return await DatabaseContext.run(database, async () => {
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
async function shutdown() {
  console.log('Shutting down gracefully...')

  // Close HTTP server
  await new Promise<void>((resolve) => {
    server.close(() => {
      console.log('HTTP server closed')
      resolve()
    })
  })

  // Close database connection pool
  if (sql) {
    await sql.end({ timeout: 5 })
    console.log('Database connections closed')
  }

  process.exit(0)
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received')
  shutdown()
})

process.on('SIGINT', () => {
  console.log('SIGINT received')
  shutdown()
})
