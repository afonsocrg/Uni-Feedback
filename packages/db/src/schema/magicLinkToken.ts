import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const magicLinkTokens = pgTable('magic_link_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(), // Store email, not userId (user may not exist yet)
  tokenHash: text('token_hash').notNull().unique(),
  requestId: text('request_id'), // For polling - can be shared across multiple requests
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }), // Set when email token is used
  verifiedAt: timestamp('verified_at', { withTimezone: true }), // Set when requestId is verified
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect
export type NewMagicLinkToken = typeof magicLinkTokens.$inferInsert
