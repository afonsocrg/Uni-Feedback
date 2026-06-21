import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  pgTable,
  serial,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { academicTerms } from './academicTerm'
import { courses } from './course'

/**
 * A specific context in which a course can be taken: a (curriculum year,
 * academic term) pair. One course can have many offerings (e.g. a course
 * available in both semesters, or in different years in different terms).
 *
 * `curriculumYear` is the structural position in the degree plan (1, 2, 3...),
 * NOT the academic year (2025/2026). It is nullable: for many courses the year
 * is simply unknown and we don't invent one.
 */
export const courseOfferings = pgTable(
  'course_offerings',
  {
    id: serial('id').primaryKey(),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    curriculumYear: integer('curriculum_year'),
    academicTermId: integer('academic_term_id')
      .notNull()
      .references(() => academicTerms.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
  },
  (table) => [
    unique('course_offerings_unique').on(
      table.courseId,
      table.curriculumYear,
      table.academicTermId
    ),
    check(
      'course_offerings_valid_year',
      sql`${table.curriculumYear} IS NULL OR ${table.curriculumYear} >= 1`
    )
  ]
)

export type CourseOffering = typeof courseOfferings.$inferSelect
export type NewCourseOffering = typeof courseOfferings.$inferInsert
