import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const magicLinkTokens = pgTable('magic_link_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(), // Store email, not userId (user may not exist yet)
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect
export type NewMagicLinkToken = typeof magicLinkTokens.$inferInsert
