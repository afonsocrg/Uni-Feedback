import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { faculties } from './faculty'

/**
 * Academic periods within a faculty, modelled as integer tick intervals.
 *
 * Ticks are abstract integers — only their relative order, containment and
 * length matter (an academic year spans 8 ticks: semester = 4, half/period = 2).
 * Terms may overlap and nest (e.g. a half-semester sits inside a full semester).
 * Not anchored to real calendar dates (see ADR-0001).
 *
 * Ordering convention: `ORDER BY start_tick ASC, end_tick DESC` so container
 * terms appear before their sub-terms.
 */
export const academicTerms = pgTable(
  'academic_terms',
  {
    id: serial('id').primaryKey(),
    facultyId: integer('faculty_id')
      .notNull()
      .references(() => faculties.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    startTick: integer('start_tick').notNull(),
    endTick: integer('end_tick').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
  },
  (table) => [
    check(
      'academic_terms_valid_interval',
      sql`${table.startTick} <= ${table.endTick}`
    ),
    // One term name per faculty — keeps seeding idempotent and term lookups stable.
    unique('academic_terms_faculty_name_unique').on(table.facultyId, table.name)
  ]
)

export type AcademicTerm = typeof academicTerms.$inferSelect
export type NewAcademicTerm = typeof academicTerms.$inferInsert
