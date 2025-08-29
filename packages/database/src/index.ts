import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export * from './schema'

export type Database = typeof schema

export function getDb(env: any) {
  return drizzle(env.DB, { schema })
}