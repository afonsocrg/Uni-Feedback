import { jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const feedbackDrafts = pgTable('feedback_drafts', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  data: jsonb('data').notNull(), // JSON blob of form data
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  ipAddress: text('ip_address') // Optional: for rate limiting
})

export type FeedbackDraft = typeof feedbackDrafts.$inferSelect
export type NewFeedbackDraft = typeof feedbackDrafts.$inferInsert
