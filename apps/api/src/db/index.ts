import { drizzle } from 'drizzle-orm/d1'

import * as schemas from '@uni-feedback/database/schema'

export type Database = typeof schemas

export function getDb(env: any) {
  return drizzle(env.DB, { schema: schemas })
}

export * from '@uni-feedback/database/schema'
