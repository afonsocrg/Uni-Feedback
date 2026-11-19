import { database, schema } from '@uni-feedback/db'
import type {
  DegreePlanItemKind,
  DegreeTrackKind
} from '@uni-feedback/db/schema'
import { asc, desc, eq, inArray } from 'drizzle-orm'
import type { Lang } from '~/i18n/config'
import { pickName } from '~/utils/localizedContent'

/**
 * The degree page's curricular plan (migration 0064): the degree's latest plan,
 * already in the page's language. Names and texts fall back to Portuguese when
 * the English one is missing. Courses come with their acronym and name so the
 * page needs nothing else to draw the plan.
 */

export interface PlanCourse {
  id: number
  acronym: string
  name: string
  ects: number | null
}

/** A pool option or a track course: a course with a page, or just a name. */
export interface PlanEntry {
  course: PlanCourse | null
  name: string | null
  ects: number | null
  group: string | null
}

export interface PlanItem {
  id: number
  kind: DegreePlanItemKind
  versionId: number | null
  course: PlanCourse | null
  /** A pool's name, or a component with no course page (a dissertation) */
  label: string | null
  yearFrom: number
  yearTo: number
  termId: number | null
  ects: number
  ectsMin: number | null
  ectsMax: number | null
  coursesMin: number | null
  coursesMax: number | null
  description: string | null
  options: PlanEntry[]
}

export interface PlanTrack {
  id: number
  kind: DegreeTrackKind
  name: string
  ectsMin: number | null
  coursesMin: number | null
  description: string | null
  rules: string | null
  courses: (PlanEntry & { isMandatory: boolean })[]
}

export interface DegreePlanData {
  id: number
  schoolYear: number
  isVerified: boolean
  sourceUrls: string[]
  description: string | null
  trackRules: string | null
  versions: { id: number; name: string }[]
  items: PlanItem[]
  tracks: PlanTrack[]
}

type Texts<T> = Map<number, Partial<Record<'pt' | 'en', T>>>

function byLang<T extends { lang: string }>(
  rows: T[],
  key: (row: T) => number
): Texts<T> {
  const map: Texts<T> = new Map()
  for (const row of rows) {
    const entry = map.get(key(row)) ?? {}
    entry[row.lang as 'pt' | 'en'] = row
    map.set(key(row), entry)
  }
  return map
}

/** The page's language when it has the field, else Portuguese */
function pick<T>(
  lang: Lang,
  texts: Partial<Record<'pt' | 'en', T>> | undefined,
  field: (row: T) => string | null
): string | null {
  const own = texts?.[lang]
  return (own && field(own)) || (texts?.pt && field(texts.pt)) || null
}

export async function loadDegreePlan(
  degreeId: number,
  lang: Lang
): Promise<DegreePlanData | null> {
  const db = database()
  const [plan] = await db
    .select()
    .from(schema.degreePlans)
    .where(eq(schema.degreePlans.degreeId, degreeId))
    .orderBy(desc(schema.degreePlans.schoolYear))
    .limit(1)
  if (!plan) return null

  const [planTexts, versions, items, tracks] = await Promise.all([
    db
      .select()
      .from(schema.degreePlanTexts)
      .where(eq(schema.degreePlanTexts.planId, plan.id)),
    db
      .select()
      .from(schema.degreePlanVersions)
      .where(eq(schema.degreePlanVersions.planId, plan.id))
      .orderBy(asc(schema.degreePlanVersions.position)),
    db
      .select()
      .from(schema.degreePlanItems)
      .where(eq(schema.degreePlanItems.planId, plan.id))
      .orderBy(asc(schema.degreePlanItems.position)),
    db
      .select()
      .from(schema.degreeTracks)
      .where(eq(schema.degreeTracks.planId, plan.id))
      .orderBy(asc(schema.degreeTracks.position))
  ])

  const itemIds = items.map((item) => item.id)
  const trackIds = tracks.map((track) => track.id)
  const [itemTexts, options, trackTexts, trackCourses] = await Promise.all([
    itemIds.length
      ? db
          .select()
          .from(schema.degreePlanItemTexts)
          .where(inArray(schema.degreePlanItemTexts.itemId, itemIds))
      : [],
    itemIds.length
      ? db
          .select()
          .from(schema.degreePlanPoolOptions)
          .where(inArray(schema.degreePlanPoolOptions.itemId, itemIds))
          .orderBy(asc(schema.degreePlanPoolOptions.position))
      : [],
    trackIds.length
      ? db
          .select()
          .from(schema.degreeTrackTexts)
          .where(inArray(schema.degreeTrackTexts.trackId, trackIds))
      : [],
    trackIds.length
      ? db
          .select()
          .from(schema.degreeTrackCourses)
          .where(inArray(schema.degreeTrackCourses.trackId, trackIds))
          .orderBy(asc(schema.degreeTrackCourses.position))
      : []
  ])

  const courseIds = [
    ...new Set(
      [...items, ...options, ...trackCourses]
        .map((row) => row.courseId)
        .filter((id): id is number => id !== null)
    )
  ]
  const courseRows = courseIds.length
    ? await db
        .select({
          id: schema.courses.id,
          acronym: schema.courses.acronym,
          name: schema.courses.name,
          nameEn: schema.courses.nameEn,
          ects: schema.courses.ects
        })
        .from(schema.courses)
        .where(inArray(schema.courses.id, courseIds))
    : []
  const courses = new Map<number, PlanCourse>(
    courseRows.map((row) => [
      row.id,
      {
        id: row.id,
        acronym: row.acronym,
        name: pickName(lang, row.name, row.nameEn).value,
        ects: row.ects
      }
    ])
  )
  const courseOf = (id: number | null) =>
    id === null ? null : (courses.get(id) ?? null)
  const localized = (pt: string | null, en: string | null) =>
    lang === 'en' ? (en ?? pt) : pt

  const planText = byLang(planTexts, (row) => row.planId).get(plan.id)
  const itemText = byLang(itemTexts, (row) => row.itemId)
  const trackText = byLang(trackTexts, (row) => row.trackId)

  const optionsByItem = new Map<number, PlanEntry[]>()
  for (const option of options) {
    const list = optionsByItem.get(option.itemId) ?? []
    list.push({
      course: courseOf(option.courseId),
      name: localized(option.name, option.nameEn),
      ects: option.ects,
      group: localized(option.groupLabel, option.groupLabelEn)
    })
    optionsByItem.set(option.itemId, list)
  }
  const coursesByTrack = new Map<number, PlanTrack['courses']>()
  for (const row of trackCourses) {
    const list = coursesByTrack.get(row.trackId) ?? []
    list.push({
      course: courseOf(row.courseId),
      name: localized(row.name, row.nameEn),
      ects: row.ects,
      group: localized(row.groupLabel, row.groupLabelEn),
      isMandatory: row.isMandatory
    })
    coursesByTrack.set(row.trackId, list)
  }

  return {
    id: plan.id,
    schoolYear: plan.schoolYear,
    isVerified: plan.verifiedAt !== null,
    sourceUrls: plan.sourceUrls,
    description: pick(lang, planText, (row) => row.description),
    trackRules: pick(lang, planText, (row) => row.trackRules),
    versions: versions.map((version) => ({
      id: version.id,
      name: localized(version.name, version.nameEn) ?? version.name
    })),
    items: items.map((item) => ({
      id: item.id,
      kind: item.kind,
      versionId: item.versionId,
      course: courseOf(item.courseId),
      label: localized(item.label, item.labelEn),
      yearFrom: item.yearFrom,
      yearTo: item.yearTo,
      termId: item.academicTermId,
      ects: item.ects,
      ectsMin: item.ectsMin,
      ectsMax: item.ectsMax,
      coursesMin: item.coursesMin,
      coursesMax: item.coursesMax,
      description: pick(lang, itemText.get(item.id), (row) => row.description),
      options: optionsByItem.get(item.id) ?? []
    })),
    tracks: tracks.map((track) => ({
      id: track.id,
      kind: track.kind,
      name: localized(track.name, track.nameEn) ?? track.name,
      ectsMin: track.ectsMin,
      coursesMin: track.coursesMin,
      description: pick(
        lang,
        trackText.get(track.id),
        (row) => row.description
      ),
      rules: pick(lang, trackText.get(track.id), (row) => row.rules),
      courses: coursesByTrack.get(track.id) ?? []
    }))
  }
}

/** Every course the plan names: its fixed courses, pool options and tracks */
export function planCourseIds(plan: DegreePlanData): number[] {
  const ids = new Set<number>()
  for (const item of plan.items) {
    if (item.course) ids.add(item.course.id)
    for (const option of item.options)
      if (option.course) ids.add(option.course.id)
  }
  for (const track of plan.tracks)
    for (const entry of track.courses)
      if (entry.course) ids.add(entry.course.id)
  return [...ids]
}
