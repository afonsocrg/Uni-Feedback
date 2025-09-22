import { IRequest } from 'itty-router'

import { ExecutionContext } from '@cloudflare/workers-types'
import { router } from '@routes'
import { DatabaseContext } from '@uni-feedback/db'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@uni-feedback/db/schema'

// Global env variable storage
let globalEnv: Env | null = null

// Getter function to access env
export function getEnv(): Env {
  if (!globalEnv) {
    throw new Error('Env not initialized')
  }
  return globalEnv
}

export default {
  fetch: async (request: IRequest, env: Env, ctx: ExecutionContext) => {
    // Set the global env when the worker starts
    globalEnv = env

    // Create database connection
    const sql = postgres(env.DATABASE_URL)
    const db = drizzle(sql, { schema })

    // Run the request within database context
    return await DatabaseContext.run(db, async () => {
      return await router.fetch(request, env, ctx)
    })
  }
}
