import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core'
import { feedbackFull } from './feedback'
import { teachers } from './teacher'

export const feedbackTeachers = pgTable(
  'mtm_feedback__teachers',
  {
    feedbackId: integer('feedback_id')
      .notNull()
      .references(() => feedbackFull.id, { onDelete: 'cascade' }),
    teacherId: integer('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
  },
  (table) => [primaryKey({ columns: [table.feedbackId, table.teacherId] })]
)

export type FeedbackTeacher = typeof feedbackTeachers.$inferSelect
export type NewFeedbackTeacher = typeof feedbackTeachers.$inferInsert
