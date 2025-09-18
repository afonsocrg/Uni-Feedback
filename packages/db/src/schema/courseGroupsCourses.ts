import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core'
import { courses } from './course'
import { courseGroup } from './courseGroup'

export const courseGroupsCourses = pgTable(
  'mtm_course_groups__courses',
  {
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    courseGroupId: integer('course_group_id')
      .notNull()
      .references(() => courseGroup.id, { onDelete: 'cascade' })
  },
  (table) => [primaryKey({ columns: [table.courseId, table.courseGroupId] })]
)

export type CourseGroupCourse = typeof courseGroupsCourses.$inferSelect
export type NewCourseGroupCourse = typeof courseGroupsCourses.$inferInsert
