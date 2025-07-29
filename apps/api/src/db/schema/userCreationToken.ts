import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { users } from './user'

export const userCreationTokens = sqliteTable('user_creation_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  )
})

export type UserCreationToken = typeof userCreationTokens.$inferSelect
export type NewUserCreationToken = typeof userCreationTokens.$inferInsert
