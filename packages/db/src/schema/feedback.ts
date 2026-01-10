import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { courses } from './course'
import { users } from './user'

export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  // User ID for authenticated submissions (new)
  // If null, the feedback was submitted anonymously (email-only, legacy)
  userId: integer('user_id').references(() => users.id),
  // Email field for backwards compatibility with anonymous submissions
  // For authenticated users (userId != null), this should match the user's email
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

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
})

export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert
