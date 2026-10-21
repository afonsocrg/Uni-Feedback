import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'

// Tuition fees per degree and school year, kept as history (migration 0053).
// schoolYear 2026 = 2026/2027. studentType: 'national' | 'international' | 'all'.
// period: 'year' | 'total' | 'semester' | 'ects'.
export const degreeFees = pgTable(
  'degree_fees',
  {
    id: serial('id').primaryKey(),
    degreeId: integer('degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
    schoolYear: integer('school_year').notNull(),
    studentType: text('student_type').notNull(),
    period: text('period').notNull(),
    amountEur: numeric('amount_eur', { precision: 10, scale: 2 }).notNull(),
    notes: text('notes'),
    sourceUrl: text('source_url').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [unique().on(t.degreeId, t.schoolYear, t.studentType, t.period)]
)

export type DegreeFee = typeof degreeFees.$inferSelect
