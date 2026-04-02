import { integer, pgTable, real, timestamp } from 'drizzle-orm/pg-core'
import { courses } from './course'

export const courseStats = pgTable('course_stats', {
  courseId: integer('course_id')
    .primaryKey()
    .references(() => courses.id, { onDelete: 'cascade' }),
  averageRating: real('average_rating'),
  averageWorkload: real('average_workload'),
  totalFeedbackCount: integer('total_feedback_count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export type CourseStats = typeof courseStats.$inferSelect
export type NewCourseStats = typeof courseStats.$inferInsert
