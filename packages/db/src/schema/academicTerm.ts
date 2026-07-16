import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
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
 * length matter, and only *within one faculty*. There is no fixed scale: a
 * faculty numbers its own timeline as densely as it needs, so a term that runs
 * between two semesters can be expressed rather than rounded into one of them.
 * Terms may overlap and nest (e.g. a half-semester sits inside a full semester).
 * Not anchored to real calendar dates (see ADR-0001).
 *
 * Ticks do **not** say how terms group for display: containment cannot tell a
 * parent from a mere container (Nova FCT's "Full Year" contains both semesters
 * but parents neither). `parentId` says it outright.
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
    /**
     * The term this one is a sub-term of, for grouping: P1 points at S1, a
     * half-semester at its semester. Null means the term is a bucket of its own,
     * which is what every top-level term needs — including a container like Nova
     * FCT's "Full Year", which nothing points at.
     *
     * Must reference a term of the same faculty. The FK cannot say so (it would
     * take a composite key whose `ON DELETE` semantics fight `faculty_id`'s
     * `NOT NULL`), so writers own that invariant.
     */
    parentId: integer('parent_id').references(
      (): AnyPgColumn => academicTerms.id,
      { onDelete: 'set null' }
    ),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
  },
  (table) => [
    check(
      'academic_terms_valid_interval',
      sql`${table.startTick} <= ${table.endTick}`
    ),
    // Deeper cycles aren't reachable: every parent is a top-level term.
    check(
      'academic_terms_parent_not_self',
      sql`${table.parentId} IS NULL OR ${table.parentId} <> ${table.id}`
    ),
    // One term name per faculty — keeps seeding idempotent and term lookups stable.
    unique('academic_terms_faculty_name_unique').on(table.facultyId, table.name)
  ]
)

export type AcademicTerm = typeof academicTerms.$inferSelect
export type NewAcademicTerm = typeof academicTerms.$inferInsert
