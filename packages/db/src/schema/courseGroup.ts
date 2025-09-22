import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { degrees } from './degree'

export const courseGroup = pgTable('course_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  degreeId: integer('degree_id').references(() => degrees.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export type CourseGroup = typeof courseGroup.$inferSelect
export type NewCourseGroup = typeof courseGroup.$inferInsert
