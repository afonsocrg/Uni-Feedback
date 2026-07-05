import { index, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core'
import { courses } from './course'
import { teachers } from './teacher'

export const courseTeacherAssignments = pgTable(
  'course_teacher_assignments',
  {
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    teacherId: integer('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    schoolYear: integer('school_year').notNull()
  },
  (table) => [
    primaryKey({
      columns: [table.teacherId, table.courseId, table.schoolYear]
    }),
    index('idx_course_teacher_assignments_course_year').on(
      table.courseId,
      table.schoolYear
    ),
    index('idx_course_teacher_assignments_teacher_id').on(table.teacherId)
  ]
)

export type CourseTeacherAssignment =
  typeof courseTeacherAssignments.$inferSelect
export type NewCourseTeacherAssignment =
  typeof courseTeacherAssignments.$inferInsert
