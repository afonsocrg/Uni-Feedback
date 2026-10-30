import {
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { degreeTypeEnum, degrees } from './degree'
import { faculties } from './faculty'

// How to apply to a degree (migration 0062, prds/content_rich_pages.md "Ingresso v2").
// Scope, most specific first: degreeId; facultyId + degreeType; facultyId; neither (national
// CNA only). The scope checks live in the migration.

export const ADMISSION_ROUTES = ['cna', 'direct', 'special'] as const
export type AdmissionRoute = (typeof ADMISSION_ROUTES)[number]

export const ADMISSION_AUDIENCES = [
  'all',
  'national',
  'international',
  'internal'
] as const
export type AdmissionAudience = (typeof ADMISSION_AUDIENCES)[number]

// Our own text per language: what a student needs and the steps (markdown). Shown only
// when reviewedAt is set.
export const admissionGuides = pgTable(
  'admission_guides',
  {
    id: serial('id').primaryKey(),
    facultyId: integer('faculty_id').references(() => faculties.id, {
      onDelete: 'cascade'
    }),
    degreeId: integer('degree_id').references(() => degrees.id, {
      onDelete: 'cascade'
    }),
    degreeType: degreeTypeEnum('degree_type'),
    route: text('route').$type<AdmissionRoute>().notNull(),
    audience: text('audience')
      .$type<AdmissionAudience>()
      .notNull()
      .default('all'),
    lang: text('lang').notNull(),
    body: text('body').notNull(),
    // For the Ingresso summary: the requirements in one sentence, and the fee
    summary: text('summary'),
    applicationFeeEur: numeric('application_fee_eur', {
      precision: 10,
      scale: 2
    }),
    applicationFeeNote: text('application_fee_note'),
    applyUrl: text('apply_url'),
    sourceUrls: jsonb('source_urls').$type<string[]>().notNull().default([]),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [
    unique('admission_guides_scope_unique')
      .on(t.facultyId, t.degreeId, t.degreeType, t.route, t.audience, t.lang)
      .nullsNotDistinct()
  ]
)

// One row per round (fase) of one intake; schoolYear 2027 = 2027/2028. NULL date = unknown.
export const admissionRounds = pgTable(
  'admission_rounds',
  {
    id: serial('id').primaryKey(),
    facultyId: integer('faculty_id').references(() => faculties.id, {
      onDelete: 'cascade'
    }),
    degreeId: integer('degree_id').references(() => degrees.id, {
      onDelete: 'cascade'
    }),
    degreeType: degreeTypeEnum('degree_type'),
    route: text('route').$type<AdmissionRoute>().notNull(),
    audience: text('audience')
      .$type<AdmissionAudience>()
      .notNull()
      .default('all'),
    schoolYear: integer('school_year').notNull(),
    position: integer('position').notNull(),
    labelPt: text('label_pt').notNull(),
    labelEn: text('label_en').notNull(),
    opensOn: date('opens_on'),
    closesOn: date('closes_on'),
    resultsOn: date('results_on'),
    notes: text('notes'),
    sourceUrl: text('source_url').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [
    unique('admission_rounds_scope_unique')
      .on(
        t.facultyId,
        t.degreeId,
        t.degreeType,
        t.route,
        t.audience,
        t.schoolYear,
        t.position
      )
      .nullsNotDistinct()
  ]
)

export type AdmissionGuide = typeof admissionGuides.$inferSelect
export type AdmissionRound = typeof admissionRounds.$inferSelect
