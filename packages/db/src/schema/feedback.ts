import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { courses } from './course'

export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  email: text('email'),
  schoolYear: integer('school_year'),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id),
  rating: integer('rating').notNull(),
  workloadRating: integer('workload_rating'),
  comment: text('comment'),
  originalComment: text('original_comment'),

  // This is the date the feedback was approved
  // If null, it means the feedback is pending approval,
  // and should not be shown in the public-facing pages
  approvedAt: timestamp('approved_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})

export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert
