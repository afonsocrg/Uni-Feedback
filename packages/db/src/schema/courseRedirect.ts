import { index, integer, pgTable, timestamp } from 'drizzle-orm/pg-core'
import { courses } from './course'

// Deleted course ids that still resolve, so a merge or a dropped degree doesn't
// break past URLs (migration 0063). No trigger: whoever deletes a course with a
// successor writes the row in the same script. `old_course_id` has no foreign
// key, the course it named is gone.

export const courseRedirects = pgTable(
  'course_redirects',
  {
    oldCourseId: integer('old_course_id').primaryKey(),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [index('course_redirects_course_id_idx').on(t.courseId)]
)

export type CourseRedirect = typeof courseRedirects.$inferSelect
