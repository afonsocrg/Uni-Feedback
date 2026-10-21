import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'
import { faculties } from './faculty'

// Old slugs that still resolve, so a rename doesn't break past URLs. Written
// by triggers on faculties/degrees (migration 0046), never by hand. Each row
// points at the entity's id, so chains of renames resolve in one hop.

export const facultySlugRedirects = pgTable('faculty_slug_redirects', {
  id: serial('id').primaryKey(),
  oldSlug: text('old_slug').notNull().unique(),
  facultyId: integer('faculty_id')
    .notNull()
    .references(() => faculties.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

// Degree slugs are only unique within a faculty, hence (faculty_id, old_slug)
export const degreeSlugRedirects = pgTable(
  'degree_slug_redirects',
  {
    id: serial('id').primaryKey(),
    facultyId: integer('faculty_id')
      .notNull()
      .references(() => faculties.id, { onDelete: 'cascade' }),
    oldSlug: text('old_slug').notNull(),
    degreeId: integer('degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [unique().on(t.facultyId, t.oldSlug)]
)

export type FacultySlugRedirect = typeof facultySlugRedirects.$inferSelect
export type DegreeSlugRedirect = typeof degreeSlugRedirects.$inferSelect
