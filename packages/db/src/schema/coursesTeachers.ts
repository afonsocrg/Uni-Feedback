import { index, integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core'
import { courses } from './course'
import { teachers } from './teacher'

export const coursesTeachers = pgTable(
  'mtm_courses__teachers',
  {
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    teacherId: integer('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    latestSchoolYear: text('latest_school_year'),
    latestSemester: text('latest_semester'),
    latestExecutionLabel: text('latest_execution_label'),
    latestExecutionUrl: text('latest_execution_url')
  },
  (table) => [
    primaryKey({ columns: [table.courseId, table.teacherId] }),
    index('idx_mtm_courses_teachers_teacher_id').on(table.teacherId)
  ]
)

export type CourseTeacher = typeof coursesTeachers.$inferSelect
export type NewCourseTeacher = typeof coursesTeachers.$inferInsert
