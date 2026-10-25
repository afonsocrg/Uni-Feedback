import { database, schema } from '@uni-feedback/db'
import type { DegreeType } from '@uni-feedback/db/schema'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { and, asc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm'
import type { DegreeCampusInfo } from '~/components/degree/pageTypes'
import type {
  FeeRange,
  UniversityBachelor,
  UniversityDegree,
  UniversityFaculty,
  UniversityListItem,
  UniversityPageData
} from '~/components/university/types'
import type { Lang } from '~/i18n/config'
import {
  isMostlyFallback,
  pickName,
  pickText,
  type ContentLang
} from '~/utils/localizedContent'
import { loadOfficialLinks } from './entityLinks.server'

/**
 * Loaders for the university pages (prds/content_rich_pages.md, "University").
 * Aggregates over the faculties of one university: degrees taught today,
 * feedback, campuses, 1ª fase admission results (DGES) and fees. Rough first version: one set of queries serves the main page and
 * both sub-pages.
 */

type Db = ReturnType<typeof database>

/** Degrees taught today: at least one course still in the plan */
const ACTIVE_DEGREE = sql`exists (
  select 1 from courses c
  where c.degree_id = d.id and c.last_taught_year is null
)`

const CNA_TYPES: DegreeType[] = ['bachelor', 'integrated_master']

const num = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function loadUniversityList(
  lang: Lang
): Promise<UniversityListItem[]> {
  const db = database()
  const [universities, faculties, degreeCounts, feedbackCounts, cities] =
    await Promise.all([
      db
        .select()
        .from(schema.universities)
        .orderBy(asc(schema.universities.id)),
      db
        .select({
          universityId: schema.faculties.universityId,
          slug: schema.faculties.slug,
          shortName: schema.faculties.shortName,
          name: schema.faculties.name,
          nameEn: schema.faculties.nameEn
        })
        .from(schema.faculties)
        .orderBy(asc(schema.faculties.id)),
      db.execute<{ university_id: number; n: number }>(sql`
        select f.university_id, count(*)::int as n
        from degrees d join faculties f on f.id = d.faculty_id
        where ${ACTIVE_DEGREE}
        group by 1`),
      db.execute<{ university_id: number; n: number }>(sql`
        select f.university_id, count(*)::int as n
        from feedback fb
        join courses c on c.id = fb.course_id
        join degrees d on d.id = c.degree_id
        join faculties f on f.id = d.faculty_id
        where fb.approved_at is not null
        group by 1`),
      db.execute<{ university_id: number; city: string; n: number }>(sql`
        select f.university_id, ca.city, count(*)::int as n
        from campuses ca join faculties f on f.id = ca.faculty_id
        where ca.city is not null
        group by 1, 2
        order by 3 desc`)
    ])

  const byUni = <T extends { university_id: number }>(rows: Iterable<T>) => {
    const map = new Map<number, T[]>()
    for (const row of rows) {
      const list = map.get(row.university_id) ?? []
      list.push(row)
      map.set(row.university_id, list)
    }
    return map
  }
  const degreesBy = byUni(degreeCounts)
  const feedbackBy = byUni(feedbackCounts)
  const citiesBy = byUni(cities)

  return universities
    .map((u) => ({
      id: u.id,
      slug: u.slug,
      name: pickName(lang, u.name, u.nameEn).value,
      shortName: u.shortName,
      url: u.url,
      logo: u.logo,
      cities: (citiesBy.get(u.id) ?? []).map((c) => c.city),
      faculties: faculties
        .filter((f) => f.universityId === u.id && f.slug)
        .map((f) => ({
          slug: f.slug!,
          shortName: f.shortName,
          name: pickName(lang, f.name, f.nameEn).value
        })),
      degreeCount: degreesBy.get(u.id)?.[0]?.n ?? 0,
      feedbackCount: feedbackBy.get(u.id)?.[0]?.n ?? 0
    }))
    .filter((u) => u.faculties.length > 0)
}

/** Null when no university has this slug */
export async function loadUniversityPage(
  uniSlug: string,
  lang: Lang
): Promise<UniversityPageData | null> {
  const db = database()
  const [university] = await db
    .select()
    .from(schema.universities)
    .where(eq(schema.universities.slug, uniSlug))
  if (!university) return null

  const faculties = await db
    .select({
      id: schema.faculties.id,
      slug: schema.faculties.slug,
      name: schema.faculties.name,
      nameEn: schema.faculties.nameEn,
      shortName: schema.faculties.shortName,
      logo: schema.faculties.logo
    })
    .from(schema.faculties)
    .where(eq(schema.faculties.universityId, university.id))
    .orderBy(asc(schema.faculties.id))
  const facultyIds = faculties.map((f) => f.id)

  const [
    degrees,
    feedbackByFaculty,
    campuses,
    admissions,
    fees,
    topCourses,
    others,
    details,
    links
  ] = await Promise.all([
    loadDegrees(db, university.id, lang),
    db.execute<{ faculty_id: number; n: number }>(sql`
      select d.faculty_id, count(*)::int as n
      from feedback fb
      join courses c on c.id = fb.course_id
      join degrees d on d.id = c.degree_id
      join faculties f on f.id = d.faculty_id
      where f.university_id = ${university.id} and fb.approved_at is not null
      group by 1`),
    facultyIds.length > 0
      ? db
          .select()
          .from(schema.campuses)
          .where(inArray(schema.campuses.facultyId, facultyIds))
          .orderBy(asc(schema.campuses.id))
      : Promise.resolve([]),
    loadAdmissions(db, university.id),
    loadFees(db, university.id),
    db.execute<{
      faculty_id: number
      id: number
      name: string
      n: number
    }>(sql`
      select distinct on (d.faculty_id) d.faculty_id, c.id, c.name,
        cs.total_feedback_count as n
      from courses c
      join course_stats cs on cs.course_id = c.id
      join degrees d on d.id = c.degree_id
      join faculties f on f.id = d.faculty_id
      where f.university_id = ${university.id}
        and c.last_taught_year is null and cs.total_feedback_count > 0
      order by d.faculty_id, cs.total_feedback_count desc, c.id`),
    db
      .select({
        slug: schema.universities.slug,
        name: schema.universities.name,
        nameEn: schema.universities.nameEn,
        shortName: schema.universities.shortName
      })
      .from(schema.universities)
      .where(ne(schema.universities.id, university.id))
      .orderBy(asc(schema.universities.id)),
    // Reviewed intros only
    db
      .select({
        lang: schema.universityDetails.lang,
        description: schema.universityDetails.description
      })
      .from(schema.universityDetails)
      .where(
        and(
          eq(schema.universityDetails.universityId, university.id),
          isNotNull(schema.universityDetails.reviewedAt)
        )
      ),
    loadOfficialLinks('university', university.id)
  ])
  const intro = pickText(
    lang,
    Object.fromEntries(
      details.map((d) => [d.lang as ContentLang, d.description])
    )
  )

  const feedbackMap = new Map(
    [...feedbackByFaculty].map((r) => [r.faculty_id, r.n])
  )
  const topCourseMap = new Map([...topCourses].map((r) => [r.faculty_id, r]))

  const bachelors: UniversityBachelor[] = degrees
    .filter((d) => CNA_TYPES.includes(d.type))
    .map((d) => {
      const a = admissions.byDegree.get(d.id)
      return {
        facultySlug: d.facultySlug,
        facultyShortName: d.facultyShortName,
        slug: d.slug,
        acronym: d.acronym,
        name: d.name,
        type: d.type,
        ects: d.ects,
        durationSemesters: d.durationSemesters,
        vagas: a?.vagas ?? null,
        grade: a?.grade ?? null,
        previousGrade: a?.previousGrade ?? null
      }
    })
    .sort(
      (a, b) =>
        (b.grade ?? -1) - (a.grade ?? -1) || a.name.localeCompare(b.name)
    )

  const facultyRows: UniversityFaculty[] = faculties
    .filter((f) => f.slug)
    .map((f) => {
      const own = degrees.filter((d) => d.facultyId === f.id)
      const degreeCounts: Partial<Record<DegreeType, number>> = {}
      for (const d of own)
        degreeCounts[d.type] = (degreeCounts[d.type] ?? 0) + 1
      const withData = bachelors.filter(
        (b) => b.facultySlug === f.slug && b.grade !== null
      )
      const grades = withData.map((b) => b.grade!)
      const top = [...own].sort((a, b) => b.feedbackCount - a.feedbackCount)[0]
      const topCourse = topCourseMap.get(f.id)
      return {
        id: f.id,
        slug: f.slug!,
        name: pickName(lang, f.name, f.nameEn).value,
        shortName: f.shortName,
        logo: f.logo,
        campuses: campuses
          .filter((c) => c.facultyId === f.id)
          .map(toCampusInfo),
        degreeCounts,
        degreeCount: own.length,
        feedbackCount: feedbackMap.get(f.id) ?? 0,
        admissions:
          withData.length > 0
            ? {
                vagas: withData.reduce((sum, b) => sum + (b.vagas ?? 0), 0),
                minGrade: Math.min(...grades),
                maxGrade: Math.max(...grades),
                degrees: withData.length
              }
            : null,
        fees: fees.byFaculty.get(f.id) ?? {},
        topDegree:
          top && top.feedbackCount > 0
            ? {
                slug: top.slug,
                acronym: top.acronym,
                name: top.name,
                feedbackCount: top.feedbackCount
              }
            : null,
        topCourse: topCourse
          ? {
              id: topCourse.id,
              name: topCourse.name,
              feedbackCount: topCourse.n
            }
          : null
      }
    })

  const degreeCounts: Partial<Record<DegreeType, number>> = {}
  for (const d of degrees)
    degreeCounts[d.type] = (degreeCounts[d.type] ?? 0) + 1

  return {
    university: {
      id: university.id,
      slug: university.slug,
      name: pickName(lang, university.name, university.nameEn).value,
      shortName: university.shortName,
      url: university.url,
      logo: university.logo
    },
    faculties: facultyRows,
    degreeCounts,
    degreeCount: degrees.length,
    feedbackCount: facultyRows.reduce((sum, f) => sum + f.feedbackCount, 0),
    degrees: degrees
      .map(
        (d): UniversityDegree => ({
          facultySlug: d.facultySlug,
          facultyShortName: d.facultyShortName,
          slug: d.slug,
          acronym: d.acronym,
          name: d.name,
          type: d.type,
          ects: d.ects,
          durationSemesters: d.durationSemesters,
          feedbackCount: d.feedbackCount
        })
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
    bachelors,
    admissionYear: admissions.year,
    feesSchoolYear: fees.schoolYear,
    others: others.map((o) => ({
      slug: o.slug,
      name: pickName(lang, o.name, o.nameEn).value,
      shortName: o.shortName
    })),
    intro,
    isMostlyFallback: isMostlyFallback([intro]),
    links
  }
}

function toCampusInfo(
  campus: typeof schema.campuses.$inferSelect
): DegreeCampusInfo {
  return {
    id: campus.id,
    name: campus.name,
    address: campus.address,
    postalCode: campus.postalCode,
    city: campus.city,
    latitude: campus.latitude,
    longitude: campus.longitude,
    phone: campus.phone,
    email: campus.email,
    url: campus.url
  }
}

async function loadDegrees(db: Db, universityId: number, lang: Lang) {
  const rows = await db.execute<{
    id: number
    faculty_id: number
    faculty_slug: string
    faculty_short_name: string
    slug: string
    acronym: string
    name: string
    name_en: string | null
    type: DegreeType
    ects: number | null
    duration_semesters: number | null
    feedback_count: number
  }>(sql`
    select d.id, d.faculty_id, f.slug as faculty_slug,
      f.short_name as faculty_short_name, d.slug, d.acronym, d.name, d.name_en,
      d.type,
      d.ects, d.duration_semesters,
      coalesce(ds.feedback_count, 0)::int as feedback_count
    from degrees d
    join faculties f on f.id = d.faculty_id
    left join degree_stats ds on ds.degree_id = d.id
    where f.university_id = ${universityId} and d.slug is not null
      and f.slug is not null and ${ACTIVE_DEGREE}
    order by d.id`)
  return [...rows].map((r) => ({
    id: r.id,
    facultyId: r.faculty_id,
    facultySlug: r.faculty_slug,
    facultyShortName: r.faculty_short_name,
    slug: r.slug,
    acronym: r.acronym,
    name: pickName(lang, r.name, r.name_en).value,
    type: r.type,
    ects: num(r.ects),
    durationSemesters: r.duration_semesters,
    feedbackCount: r.feedback_count
  }))
}

/**
 * 1ª fase results of the latest year (and the one before), per degree, over
 * its DGES (unit, course) pairs. A degree with a pós-laboral track sums both
 * tracks' vagas and keeps the higher grade: good enough for a university
 * overview, the degree page has the per-track detail.
 */
async function loadAdmissions(db: Db, universityId: number) {
  const rows = await db.execute<{
    degree_id: number
    year: number
    vagas: number | null
    grade: string | null
  }>(sql`
    with pairs as (
      select distinct e.degree_id,
        split_part(e.external_id, '/', 1) as unit_code,
        split_part(e.external_id, '/', 2) as course_code
      from sources.degree_external_ids e
      join degrees d on d.id = e.degree_id
      join faculties f on f.id = d.faculty_id
      where e.source = 'dges' and f.university_id = ${universityId}
    ),
    results as (
      select p.degree_id, a.year, a.vagas, a.last_grade
      from pairs p
      join sources.dges_admissions a
        on a.unit_code = p.unit_code and a.course_code = p.course_code
      where a.fase = 1
    )
    select degree_id, year, sum(vagas)::int as vagas, max(last_grade) as grade
    from results
    where year >= (select max(year) - 1 from results)
    group by 1, 2`)
  const list = [...rows]
  const year = list.length > 0 ? Math.max(...list.map((r) => r.year)) : null
  const byDegree = new Map<
    number,
    { vagas: number | null; grade: number | null; previousGrade: number | null }
  >()
  for (const r of list) {
    const entry = byDegree.get(r.degree_id) ?? {
      vagas: null,
      grade: null,
      previousGrade: null
    }
    if (r.year === year) {
      entry.vagas = r.vagas
      entry.grade = num(r.grade)
    } else {
      entry.previousGrade = num(r.grade)
    }
    byDegree.set(r.degree_id, entry)
  }
  return { year, byDegree }
}

/** This school year's fees (or the latest before it), national or all students */
async function loadFees(db: Db, universityId: number) {
  const current = getCurrentSchoolYear()
  const rows = await db.execute<{
    faculty_id: number
    type: DegreeType
    school_year: number
    period: string
    min: string
    max: string
  }>(sql`
    with scoped as (
      select d.faculty_id, d.type, df.school_year, df.period, df.amount_eur
      from degree_fees df
      join degrees d on d.id = df.degree_id
      join faculties f on f.id = d.faculty_id
      where f.university_id = ${universityId}
        and df.student_type in ('national', 'all')
        and df.school_year <= ${current}
        and ${ACTIVE_DEGREE}
    )
    select faculty_id, type, school_year, period,
      min(amount_eur) as min, max(amount_eur) as max
    from scoped
    where school_year = (select max(school_year) from scoped)
    group by 1, 2, 3, 4
    order by 1, 2, 4`)
  const list = [...rows]
  const byFaculty = new Map<number, Partial<Record<DegreeType, FeeRange[]>>>()
  for (const r of list) {
    const fees = byFaculty.get(r.faculty_id) ?? {}
    const ranges = fees[r.type] ?? []
    ranges.push({ period: r.period, min: Number(r.min), max: Number(r.max) })
    fees[r.type] = ranges
    byFaculty.set(r.faculty_id, fees)
  }
  return { schoolYear: list[0]?.school_year ?? null, byFaculty }
}
