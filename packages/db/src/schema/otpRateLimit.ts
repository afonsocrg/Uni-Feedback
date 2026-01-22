import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const otpRateLimits = pgTable('otp_rate_limits', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  lastRequestAt: timestamp('last_request_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})

export type OtpRateLimit = typeof otpRateLimits.$inferSelect
export type NewOtpRateLimit = typeof otpRateLimits.$inferInsert
