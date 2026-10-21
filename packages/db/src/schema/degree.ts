import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { faculties } from './faculty'

// The closed set of degree types, in the order they are listed to students.
// `other` holds what a faculty catalogues as a degree but isn't one (IST's HACS).
export const DEGREE_TYPES = [
  'bachelor',
  'integrated_master',
  'master',
  'minor',
  'postgraduate',
  'phd',
  'other'
] as const

export type DegreeType = (typeof DEGREE_TYPES)[number]

export const degreeTypeEnum = pgEnum('degree_type', DEGREE_TYPES)

export const degrees = pgTable('degrees', {
  id: serial('id').primaryKey(),
  externalId: text('external_id'),
  type: degreeTypeEnum('type').notNull(),
  name: text('name').notNull(),
  acronym: text('acronym').notNull(),
  slug: text('slug'),
  campus: text('campus').notNull(), // This field may be removed later. It may be too specific
  description: text('description'),
  url: text('url'),
  facultyId: integer('faculty_id').references(() => faculties.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export type Degree = typeof degrees.$inferSelect
export type NewDegree = typeof degrees.$inferInsert
