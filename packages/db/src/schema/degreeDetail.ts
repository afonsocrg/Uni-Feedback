import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'

// Our own text about a degree, one row per language: written by us from the
// university's pages and the official facts, never published as scraped (see
// prds/content_rich_pages.md, "Writing the descriptions"). Only reviewed rows
// are shown. `degrees.description` holds the old scraped text and is not shown.
export const degreeDetails = pgTable(
  'degree_details',
  {
    degreeId: integer('degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
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
  (t) => [primaryKey({ columns: [t.degreeId, t.lang] })]
)

export type DegreeDetail = typeof degreeDetails.$inferSelect
export type NewDegreeDetail = typeof degreeDetails.$inferInsert
