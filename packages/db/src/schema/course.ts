import {
  boolean,
  integer,
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
  // Official (or reviewed translated) English name; EN pages fall back to `name`
  nameEn: text('name_en'),
  acronym: text('acronym').notNull(),
  slug: text('slug'),
  degreeId: integer('degree_id').references(() => degrees.id),
  ects: real('ects'),
  url: text('url'),
  // The faculty's own text, as scraped and in whatever language it publishes.
  // Per-language versions go in `course_texts`; these move there once every
  // course has its rows (migration 0058).
  description: text('description'),
  bibliography: text('bibliography'),
  assessment: text('assessment'),
  hasMandatoryExam: boolean('has_mandatory_exam'),
  isMandatory: boolean('is_mandatory'),
  duration: text('duration'),
  // Last school year the course was taught (feedback.school_year encoding,
  // 2025 = 2025/2026). NULL = still taught. See migration 0045.
  lastTaughtYear: integer('last_taught_year'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert
