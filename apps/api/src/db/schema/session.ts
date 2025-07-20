import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './user'

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull().unique(),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  )
})

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
