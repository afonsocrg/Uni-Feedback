import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { courses } from './course'

// A course's own text (the faculty's, not ours), one row per language: fetched
// from the faculty's pages in that language, or translated (`source =
// 'translation'`, shown only once reviewed). Takes over from
// courses.description / assessment / bibliography, which hold one scraped
// version in whatever language the faculty publishes (migration 0058).
export const courseDetails = pgTable(
  'course_details',
  {
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    lang: text('lang').$type<'pt' | 'en'>().notNull(),
    description: text('description'),
    assessment: text('assessment'),
    bibliography: text('bibliography'),
    // 'fenix', 'guia_unl', 'nova_ims', 'sigarra', ... or 'translation'
    source: text('source').notNull(),
    sourceUrl: text('source_url'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [primaryKey({ columns: [t.courseId, t.lang] })]
)

export type CourseDetail = typeof courseDetails.$inferSelect
export type NewCourseDetail = typeof courseDetails.$inferInsert
