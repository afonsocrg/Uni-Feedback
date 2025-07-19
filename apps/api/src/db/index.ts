import { drizzle } from 'drizzle-orm/d1'

import * as schemas from './schema'

export type Database = typeof schemas

export function getDb(env: any) {
  return drizzle(env.DB, { schema: schemas })
}

export * from './schema'
