import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { faculties } from './faculty'

// Our own text about a faculty, one row per language, like degree_details:
// written by us from the faculty's official pages, never published as scraped
// (prds/content_rich_pages.md decision 12). Only reviewed rows are shown; an
// EN page without a reviewed EN row shows no intro.
export const facultyDetails = pgTable(
  'faculty_details',
  {
    facultyId: integer('faculty_id')
      .notNull()
      .references(() => faculties.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(),
    // Markdown
    description: text('description').notNull(),
    // The pages the text was written from
    sourceUrls: jsonb('source_urls').$type<string[]>().notNull().default([]),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [primaryKey({ columns: [t.facultyId, t.lang] })]
)

export type FacultyDetail = typeof facultyDetails.$inferSelect
export type NewFacultyDetail = typeof facultyDetails.$inferInsert
