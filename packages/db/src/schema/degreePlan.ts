import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { academicTerms } from './academicTerm'
import { courses } from './course'
import { degrees } from './degree'

// A degree's curricular plan: what the degree asks of a student, and where in
// the degree each part is recommended. Independent of course_offerings (when a
// course actually runs) and course_groups (how /cadeiras filters). Migration
// 0064. Domain model: docs/data-model/curricular_plan.md (workspace repo).
//
// Descriptive, not a validator: nothing assumes a row adds up to 60 ECTS.

export type PlanLang = 'pt' | 'en'

// One plan per degree and school year (feedback.school_year encoding: 2026 =
// 2026/27). A new year's plan is a new row; the old one stays.
export const degreePlans = pgTable(
  'degree_plans',
  {
    id: serial('id').primaryKey(),
    degreeId: integer('degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
    schoolYear: integer('school_year').notNull(),
    // The pages or PDFs the structure was taken from
    sourceUrls: jsonb('source_urls').$type<string[]>().notNull().default([]),
    // Set once the structure was checked by hand against the sources
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [
    unique('degree_plans_degree_id_school_year_unique').on(
      t.degreeId,
      t.schoolYear
    )
  ]
)

// "Como funciona": how the plan works, and the rule over its tracks, per
// language. `translatedFrom` marks a translation, as in course_texts.
export const degreePlanTexts = pgTable(
  'degree_plan_texts',
  {
    planId: integer('plan_id')
      .notNull()
      .references(() => degreePlans.id, { onDelete: 'cascade' }),
    lang: text('lang').$type<PlanLang>().notNull(),
    description: text('description'),
    trackRules: text('track_rules'),
    translatedFrom: text('translated_from').$type<PlanLang>(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ name: 'degree_plan_texts_pk', columns: [t.planId, t.lang] })
  ]
)

// An alternative ordering the faculty publishes for the same plan (Nova SBE's
// Versão A/B, FDUL's turmas). Most plans have none.
export const degreePlanVersions = pgTable(
  'degree_plan_versions',
  {
    id: serial('id').primaryKey(),
    planId: integer('plan_id')
      .notNull()
      .references(() => degreePlans.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameEn: text('name_en'),
    position: integer('position').notNull().default(0)
  },
  (t) => [index('degree_plan_versions_plan_id_idx').on(t.planId)]
)

export type DegreePlanItemKind = 'course' | 'pool'

// One block of the plan. A 'course' is a fixed component: a course with a page
// (courseId), or a component named by `label` (a dissertation). A 'pool' is a
// choice, named by `label`, with its options in degree_plan_pool_options.
export const degreePlanItems = pgTable(
  'degree_plan_items',
  {
    id: serial('id').primaryKey(),
    planId: integer('plan_id')
      .notNull()
      .references(() => degreePlans.id, { onDelete: 'cascade' }),
    // NULL: the item is in every version
    versionId: integer('version_id').references(
      (): AnyPgColumn => degreePlanVersions.id,
      { onDelete: 'cascade' }
    ),
    kind: text('kind').$type<DegreePlanItemKind>().notNull(),
    courseId: integer('course_id').references(() => courses.id),
    label: text('label'),
    labelEn: text('label_en'),
    // The years it can be taken in ("1.º ou 2.º ano" is 1, 2)
    yearFrom: integer('year_from').notNull(),
    yearTo: integer('year_to').notNull(),
    // The recommended term, a term of the degree's faculty. NULL when the plan
    // gives none: a pool taken in either semester, a course in rotation.
    academicTermId: integer('academic_term_id').references(
      () => academicTerms.id,
      { onDelete: 'set null' }
    ),
    // The nominal ECTS, the size drawn
    ects: real('ects').notNull(),
    ectsMin: real('ects_min'),
    ectsMax: real('ects_max'),
    // Only when the source states the rule in courses ("1 de 3")
    coursesMin: integer('courses_min'),
    coursesMax: integer('courses_max'),
    position: integer('position').notNull().default(0)
  },
  (t) => [
    index('degree_plan_items_plan_id_idx').on(t.planId),
    index('degree_plan_items_course_id_idx').on(t.courseId)
  ]
)

export const degreePlanItemTexts = pgTable(
  'degree_plan_item_texts',
  {
    itemId: integer('item_id')
      .notNull()
      .references(() => degreePlanItems.id, { onDelete: 'cascade' }),
    lang: text('lang').$type<PlanLang>().notNull(),
    description: text('description').notNull(),
    translatedFrom: text('translated_from').$type<PlanLang>(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({
      name: 'degree_plan_item_texts_pk',
      columns: [t.itemId, t.lang]
    })
  ]
)

// Every course a pool lets a student take, in order, even when it repeats
// another pool's list. A course with a page (courseId) or one without (name).
export const degreePlanPoolOptions = pgTable(
  'degree_plan_pool_options',
  {
    id: serial('id').primaryKey(),
    itemId: integer('item_id')
      .notNull()
      .references(() => degreePlanItems.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    courseId: integer('course_id').references(() => courses.id),
    name: text('name'),
    nameEn: text('name_en'),
    ects: real('ects'),
    // A heading in the list (the Major a course belongs to, a language)
    groupLabel: text('group_label'),
    groupLabelEn: text('group_label_en')
  },
  (t) => [
    index('degree_plan_pool_options_item_id_idx').on(t.itemId),
    index('degree_plan_pool_options_course_id_idx').on(t.courseId)
  ]
)

export type DegreeTrackKind =
  | 'specialization'
  | 'secondary'
  | 'major'
  | 'minor'
  | 'path'

// A named group of courses that earns something: an IST specialization area,
// a FLUL Major or Minor, a GENI path. Listed under the plan, not a block in it.
export const degreeTracks = pgTable(
  'degree_tracks',
  {
    id: serial('id').primaryKey(),
    planId: integer('plan_id')
      .notNull()
      .references(() => degreePlans.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<DegreeTrackKind>().notNull(),
    name: text('name').notNull(),
    nameEn: text('name_en'),
    ectsMin: real('ects_min'),
    coursesMin: integer('courses_min'),
    position: integer('position').notNull().default(0),
    sourceUrls: jsonb('source_urls').$type<string[]>().notNull().default([]),
    verifiedAt: timestamp('verified_at', { withTimezone: true })
  },
  (t) => [index('degree_tracks_plan_id_idx').on(t.planId)]
)

export const degreeTrackTexts = pgTable(
  'degree_track_texts',
  {
    trackId: integer('track_id')
      .notNull()
      .references(() => degreeTracks.id, { onDelete: 'cascade' }),
    lang: text('lang').$type<PlanLang>().notNull(),
    description: text('description'),
    rules: text('rules'),
    translatedFrom: text('translated_from').$type<PlanLang>(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ name: 'degree_track_texts_pk', columns: [t.trackId, t.lang] })
  ]
)

export const degreeTrackCourses = pgTable(
  'degree_track_courses',
  {
    id: serial('id').primaryKey(),
    trackId: integer('track_id')
      .notNull()
      .references(() => degreeTracks.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    courseId: integer('course_id').references(() => courses.id),
    name: text('name'),
    nameEn: text('name_en'),
    ects: real('ects'),
    groupLabel: text('group_label'),
    groupLabelEn: text('group_label_en'),
    isMandatory: boolean('is_mandatory').notNull().default(false)
  },
  (t) => [
    index('degree_track_courses_track_id_idx').on(t.trackId),
    index('degree_track_courses_course_id_idx').on(t.courseId)
  ]
)

export type DegreePlan = typeof degreePlans.$inferSelect
export type DegreePlanText = typeof degreePlanTexts.$inferSelect
export type DegreePlanVersion = typeof degreePlanVersions.$inferSelect
export type DegreePlanItem = typeof degreePlanItems.$inferSelect
export type DegreePlanItemText = typeof degreePlanItemTexts.$inferSelect
export type DegreePlanPoolOption = typeof degreePlanPoolOptions.$inferSelect
export type DegreeTrack = typeof degreeTracks.$inferSelect
export type DegreeTrackText = typeof degreeTrackTexts.$inferSelect
export type DegreeTrackCourse = typeof degreeTrackCourses.$inferSelect
