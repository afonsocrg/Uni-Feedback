import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { courses } from './course'
import { courseGroup } from './courseGroup'

export const courseGroupsCourses = sqliteTable(
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
