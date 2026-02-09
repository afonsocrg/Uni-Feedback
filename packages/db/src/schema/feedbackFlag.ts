import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { feedbackFull } from './feedback'
import { users } from './user'

// Single source of truth for report categories
export const REPORT_CATEGORY_LABELS = {
  harassment_hate_speech: 'Harassment / Hate Speech',
  spam_irrelevant: 'Spam / Irrelevant',
  inaccurate_information: 'Inaccurate Information',
  privacy_violation: 'Privacy Violation',
  outdated_content: 'Outdated Content',
  other: 'Other'
} as const

// Infer the type from the labels dict keys
export type ReportCategory = keyof typeof REPORT_CATEGORY_LABELS

// Array of category values for use in zod schemas, etc.
export const REPORT_CATEGORIES = Object.keys(REPORT_CATEGORY_LABELS) as [
  ReportCategory,
  ...ReportCategory[]
]

export const reportCategoryEnum = pgEnum('report_category', REPORT_CATEGORIES)

export const feedbackFlags = pgTable('feedback_flags', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  feedbackId: integer('feedback_id')
    .notNull()
    .references(() => feedbackFull.id, { onDelete: 'cascade' }),
  category: reportCategoryEnum('category').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  moderatedAt: timestamp('moderated_at', { withTimezone: true })
})

export type FeedbackFlag = typeof feedbackFlags.$inferSelect
export type NewFeedbackFlag = typeof feedbackFlags.$inferInsert
