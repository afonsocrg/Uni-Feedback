import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { degrees } from './degree'
export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // The credits of the same course (course with the same id) can change from degree to degree

  // This value changes every semester (some courses exist in both semesters).
  // Fenix has one ID per course execution,
  // but here we're simplifying it to one ID per course.
  // Every year (between academic years) we need to update this value.
  externalId: text('external_id'),
  name: text('name').notNull(),
  acronym: text('acronym').notNull(),
  degreeId: integer('degree_id').references(() => degrees.id),
  ects: real('ects'),
  terms: text('terms', { mode: 'json' }),
  description: text('description'),
  url: text('url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  assessment: text('assessment')
})

export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert
