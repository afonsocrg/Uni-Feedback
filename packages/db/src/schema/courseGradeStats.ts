import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  pgTable,
  real,
  serial,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { courses } from './course'

/**
 * Average final grade of a course in one school year, from official results.
 *
 * Entered by hand for now (see migration 0044). `schoolYear` uses the
 * `feedback.school_year` encoding (2025 = 2025/2026); `averageGrade` is on the
 * 0-20 scale. Read across the course's `identical` set, like reviews.
 */
export const courseGradeStats = pgTable(
  'course_grade_stats',
  {
    id: serial('id').primaryKey(),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    schoolYear: integer('school_year').notNull(),
    averageGrade: real('average_grade').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    unique('course_grade_stats_course_year_unique').on(
      table.courseId,
      table.schoolYear
    ),
    check(
      'course_grade_stats_valid_grade',
      sql`${table.averageGrade} >= 0 AND ${table.averageGrade} <= 20`
    )
  ]
)

export type CourseGradeStats = typeof courseGradeStats.$inferSelect
export type NewCourseGradeStats = typeof courseGradeStats.$inferInsert
