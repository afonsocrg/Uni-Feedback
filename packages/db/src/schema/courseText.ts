import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { courses } from './course'

// A course's own texts (the faculty's, not ours), one row per field and
// language, each with its own provenance: fetched from the faculty's pages in
// that language, taken from the old courses.description / assessment /
// bibliography columns, or translated (`source = 'translation'`, with
// `translatedFrom`, shown only once reviewed). Migration 0061, replacing
// course_details.
export const courseTexts = pgTable(
  'course_texts',
  {
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    // 'description' | 'assessment' | 'bibliography'
    field: text('field').notNull(),
    lang: text('lang').$type<'pt' | 'en'>().notNull(),
    text: text('text').notNull(),
    // 'fenix', 'guia_unl', 'nova_ims', 'legacy_columns', ... or 'translation'
    source: text('source').notNull(),
    sourceUrl: text('source_url'),
    // The language a translation was made from; null for an original
    translatedFrom: text('translated_from').$type<'pt' | 'en'>(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [primaryKey({ columns: [t.courseId, t.field, t.lang] })]
)

export type CourseText = typeof courseTexts.$inferSelect
export type NewCourseText = typeof courseTexts.$inferInsert
