import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './user'

export const userCreationTokens = pgTable('user_creation_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})

export type UserCreationToken = typeof userCreationTokens.$inferSelect
export type NewUserCreationToken = typeof userCreationTokens.$inferInsert
