import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { degrees } from './degree'

export const courseGroup = sqliteTable('course_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  degreeId: integer('degree_id').references(() => degrees.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  )
})

export type CourseGroup = typeof courseGroup.$inferSelect
export type NewCourseGroup = typeof courseGroup.$inferInsert
