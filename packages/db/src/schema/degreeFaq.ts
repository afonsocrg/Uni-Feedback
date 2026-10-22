import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'

// Curated FAQ per degree and language (migration 0057). Shown before the generated
// questions; a row whose `topic` matches a generated question replaces it. Only rows
// with reviewedAt set are shown. `answer` is markdown.
export const degreeFaqs = pgTable(
  'degree_faqs',
  {
    id: serial('id').primaryKey(),
    degreeId: integer('degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(),
    position: integer('position').notNull(),
    topic: text('topic'),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    sourceUrls: jsonb('source_urls').$type<string[]>().notNull().default([]),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [unique().on(t.degreeId, t.lang, t.position)]
)

export type DegreeFaq = typeof degreeFaqs.$inferSelect
