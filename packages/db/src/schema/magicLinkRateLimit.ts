import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const magicLinkRateLimits = pgTable('magic_link_rate_limits', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  requestCount: integer('request_count').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})

export type MagicLinkRateLimit = typeof magicLinkRateLimits.$inferSelect
export type NewMagicLinkRateLimit = typeof magicLinkRateLimits.$inferInsert
