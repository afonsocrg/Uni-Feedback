import { AsyncLocalStorage } from 'node:async_hooks'

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import * as schema from './schema'

export const DatabaseContext = new AsyncLocalStorage<
  PostgresJsDatabase<typeof schema>
>()

export function database() {
  const db = DatabaseContext.getStore()
  if (!db) {
    throw new Error('DatabaseContext not set')
  }
  return db
}
