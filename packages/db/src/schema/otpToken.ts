import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const otpTokens = pgTable('otp_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  otpHash: text('otp_hash').notNull(),
  referralCode: text('referral_code'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export type OtpToken = typeof otpTokens.$inferSelect
export type NewOtpToken = typeof otpTokens.$inferInsert
