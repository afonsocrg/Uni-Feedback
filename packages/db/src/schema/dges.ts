import {
  integer,
  jsonb,
  numeric,
  primaryKey,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { sourcesSchema } from './externalId'

// DGES Concurso Nacional de Acesso results, national and raw (migration 0051). Joined to
// our degrees through degreeExternalIds (source 'dges', external id '<unit>/<course>').
// Grades on DGES's 0-200 scale.
export const dgesAdmissions = sourcesSchema.table(
  'dges_admissions',
  {
    unitCode: text('unit_code').notNull(),
    courseCode: text('course_code').notNull(),
    year: integer('year').notNull(),
    fase: integer('fase').notNull(),
    institutionName: text('institution_name'),
    courseName: text('course_name'),
    degreeLevel: text('degree_level'),
    vagas: integer('vagas'),
    colocados: integer('colocados'),
    lastGrade: numeric('last_grade', { precision: 4, scale: 1 }),
    leftoverVagas: integer('leftover_vagas'),
    sourceFile: text('source_file').notNull(),
    importedAt: timestamp('imported_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [primaryKey({ columns: [t.unitCode, t.courseCode, t.year, t.fase] })]
)

// One snapshot of the DGES guide page per (unit, course, year): entry exams, formula,
// minimum grades, next year's vagas, recent averages.
export const dgesGuide = sourcesSchema.table(
  'dges_guide',
  {
    unitCode: text('unit_code').notNull(),
    courseCode: text('course_code').notNull(),
    year: integer('year').notNull(),
    data: jsonb('data').notNull(),
    sourceUrl: text('source_url').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull()
  },
  (t) => [primaryKey({ columns: [t.unitCode, t.courseCode, t.year] })]
)

export type DgesAdmission = typeof dgesAdmissions.$inferSelect
export type DgesGuide = typeof dgesGuide.$inferSelect

// InfoCursos (DGEEC) per-degree indicators, one row per edition and indicator
// (migration 0052). National and raw; joined like the DGES tables.
export const infocursosIndicators = sourcesSchema.table(
  'infocursos_indicators',
  {
    unitCode: text('unit_code').notNull(),
    courseCode: text('course_code').notNull(),
    edition: integer('edition').notNull(),
    indicator: text('indicator').notNull(),
    degreeLevel: text('degree_level'),
    data: jsonb('data').notNull(),
    sourceFile: text('source_file').notNull(),
    importedAt: timestamp('imported_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.unitCode, t.courseCode, t.edition, t.indicator] })
  ]
)

export type InfocursosIndicator = typeof infocursosIndicators.$inferSelect
