import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),

  // The credits of the same course (course with the same id) can change from degree to degree

  // This value changes every semester (some courses exist in both semesters).
  // Fenix has one ID per course execution,
  // but here we're simplifying it to one ID per course.
  // Every year (between academic years) we need to update this value.
  externalId: text('external_id'),
  name: text('name').notNull(),
  acronym: text('acronym').notNull(),
  slug: text('slug'),
  degreeId: integer('degree_id').references(() => degrees.id),
  ects: real('ects'),
  curriculumYear: integer('curriculum_year'),
  terms: jsonb('terms'),
  url: text('url'),
  description: text('description'),
  bibliography: text('bibliography'),
  assessment: text('assessment'),
  hasMandatoryExam: boolean('has_mandatory_exam'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export type Course = typeof courses.$inferSelect & {
  terms: string[] | null
}
export type NewCourse = typeof courses.$inferInsert
