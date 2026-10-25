import {
  integer,
  pgSchema,
  primaryKey,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'
import { faculties } from './faculty'
import { universities } from './university'

// Import plumbing lives in its own Postgres schema, apart from the app's own
// data in `public`: how our entities are known to outside systems, and (later)
// the raw national data joined through them. Filled by import scripts. The app
// reads it only where it shows that data (admissions, outcomes).
export const sourcesSchema = pgSchema('sources')

// `source` names the outside system: 'dges', 'infocursos', 'fenix', 'sigarra',
// ... One entity can have several ids in one system (IST Alameda and Taguspark
// are two DGES units), but an outside id belongs to one entity of ours.

export const universityExternalIds = sourcesSchema.table(
  'university_external_ids',
  {
    id: serial('id').primaryKey(),
    universityId: integer('university_id')
      .notNull()
      .references(() => universities.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    externalId: text('external_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [unique().on(t.source, t.externalId)]
)

export const facultyExternalIds = sourcesSchema.table(
  'faculty_external_ids',
  {
    id: serial('id').primaryKey(),
    facultyId: integer('faculty_id')
      .notNull()
      .references(() => faculties.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    externalId: text('external_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [unique().on(t.source, t.externalId)]
)

// DGES and InfoCursos ids are the (unit code, course code) pair written as
// '1518/9121': a course code alone is shared by many schools.
// An outside id belongs to one degree, except InfoCursos (migration 0056): one InfoCursos
// programme can cover several of our degrees (Nova IMS specializations). The partial unique
// index enforcing that lives in the migration.
export const degreeExternalIds = sourcesSchema.table(
  'degree_external_ids',
  {
    id: serial('id').primaryKey(),
    degreeId: integer('degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    externalId: text('external_id').notNull(),
    url: text('url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [unique().on(t.source, t.externalId, t.degreeId)]
)

export type UniversityExternalId = typeof universityExternalIds.$inferSelect
export type FacultyExternalId = typeof facultyExternalIds.$inferSelect
export type DegreeExternalId = typeof degreeExternalIds.$inferSelect

// Names per entity and language as an outside source publishes them, or as we
// translated them (source = 'translation'), for provenance. The curated value
// lives on the entity (`name`, `name_en`); this records where it came from.
// `entityId` is not a foreign key: one table serves all four entities.
export const entityNames = sourcesSchema.table(
  'entity_names',
  {
    entity: text('entity')
      .$type<'university' | 'faculty' | 'degree' | 'course'>()
      .notNull(),
    entityId: integer('entity_id').notNull(),
    lang: text('lang').$type<'pt' | 'en'>().notNull(),
    name: text('name').notNull(),
    source: text('source').notNull(),
    sourceUrl: text('source_url'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [primaryKey({ columns: [t.entity, t.entityId, t.lang, t.source] })]
)
