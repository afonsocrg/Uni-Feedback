import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { courses } from './course'

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
  approvedAt: integer('approved_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  )
})

export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert
