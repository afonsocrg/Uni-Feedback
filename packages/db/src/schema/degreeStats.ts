import { integer, pgTable, timestamp } from 'drizzle-orm/pg-core'
import { degrees } from './degree'

export const degreeStats = pgTable('degree_stats', {
  degreeId: integer('degree_id')
    .primaryKey()
    .references(() => degrees.id, { onDelete: 'cascade' }),
  courseCount: integer('course_count').notNull().default(0),
  feedbackCount: integer('feedback_count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export type DegreeStats = typeof degreeStats.$inferSelect
export type NewDegreeStats = typeof degreeStats.$inferInsert
