import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'
import { faculties } from './faculty'

// A faculty's site: its own building, address, contacts and map location (migration
// 0050). Degrees link to campuses many-to-many; no link means we don't know where a
// degree is taught.
export const campuses = pgTable(
  'campuses',
  {
    id: serial('id').primaryKey(),
    facultyId: integer('faculty_id')
      .notNull()
      .references(() => faculties.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    address: text('address'),
    postalCode: text('postal_code'),
    city: text('city'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    phone: text('phone'),
    email: text('email'),
    url: text('url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [unique().on(t.facultyId, t.slug)]
)

export const degreesCampuses = pgTable(
  'mtm_degrees__campuses',
  {
    degreeId: integer('degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
    campusId: integer('campus_id')
      .notNull()
      .references(() => campuses.id, { onDelete: 'cascade' })
  },
  (t) => [primaryKey({ columns: [t.degreeId, t.campusId] })]
)

export type Campus = typeof campuses.$inferSelect
export type NewCampus = typeof campuses.$inferInsert
