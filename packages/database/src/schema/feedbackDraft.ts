import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const feedbackDrafts = sqliteTable('feedback_drafts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  data: text('data').notNull(), // JSON blob of form data
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  ipAddress: text('ip_address') // Optional: for rate limiting
})

export type FeedbackDraft = typeof feedbackDrafts.$inferSelect
export type NewFeedbackDraft = typeof feedbackDrafts.$inferInsert
