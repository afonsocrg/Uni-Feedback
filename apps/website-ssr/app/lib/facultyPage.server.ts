import { database, findFacultySlugRedirect, schema } from '@uni-feedback/db'
import type { DegreeType, Faculty } from '@uni-feedback/db/schema'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { redirect } from 'react-router'
import type {
  DegreeAdmissionSummary,
  DegreeFeeSummary,
  DegreePathway,
  FacultyCampus,
  FacultyCourseStat,
  FacultyDegree,
  FacultyHighlights,
  FacultyHubData,
  FacultyTypePageData,
  FacultyUniversity,
  SharedFirstYearCourse,
  TypePageDegree
} from '~/components/faculty/types'
import { FACULTY_HIGHLIGHT_MIN_FEEDBACK } from '~/components/faculty/types'
import type { Lang } from '~/i18n/config'
import {
  isMostlyFallback,
  pickName,
  pickText,
  withLocalizedName,
  type ContentLang,
  type Localized
} from '~/utils/localizedContent'
import { loadOfficialLinks } from './entityLinks.server'

/**
 * The faculty hub (`/:facultySlug`) and its type pages
 * (`/:facultySlug/licenciaturas`, ...): prds/content_rich_pages.md, "Faculty"
 * and "Degree type". One query per block, each over the whole faculty, so a
 * faculty with 80 degrees costs the same handful of queries as one with 1.
 *
 * A degree is listed when it still has a course in its plan, as on the old
 * faculty page (`degree_stats.course_count > 0`). Where each national table
 * comes from: `docs/data-model/degree_content_data.md` in the workspace.
 */

type Db = ReturnType<typeof database>

const HIGHLIGHT_SIZE = 5

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** The faculty, or a 301 for a renamed slug, or a 404. */
export async function findFaculty(
  request: Request,
  facultySlug: string,
  pathFor: (lang: Lang, slug: string) => string,
  detect: (pathname: string) => Lang
): Promise<Faculty> {
  const db = database()
  const faculty = await db.query.faculties.findFirst({
    where: (faculties, { eq }) => eq(faculties.slug, facultySlug)
  })
  // `name` in the page's language from here on (content translation, 0058)
  if (faculty) {
    return withLocalizedName(faculty, detect(new URL(request.url).pathname))
  }

  const currentSlug = await findFacultySlugRedirect(facultySlug)
  if (currentSlug) {
    const { pathname, search } = new URL(request.url)
    throw redirect(`${pathFor(detect(pathname), currentSlug)}${search}`, {
      status: 301
    })
  }
  throw new Response('Faculty not found', { status: 404 })
}

async function loadUniversity(
  db: Db,
  universityId: number | null,
  lang: Lang
): Promise<FacultyUniversity | null> {
  if (universityId === null) return null
  const [row] = await db
    .select({
      name: schema.universities.name,
      nameEn: schema.universities.nameEn,
      shortName: schema.universities.shortName,
      slug: schema.universities.slug
    })
    .from(schema.universities)
    .where(eq(schema.universities.id, universityId))
  return row
    ? {
        name: pickName(lang, row.name, row.nameEn).value,
        shortName: row.shortName,
        slug: row.slug
      }
    : null
}

/** Our reviewed intro in the page's language, else the Portuguese one */
async function loadIntro(
  db: Db,
  facultyId: number,
  lang: Lang
): Promise<Localized<string> | null> {
  const rows = await db
    .select({
      lang: schema.facultyDetails.lang,
      description: schema.facultyDetails.description
    })
    .from(schema.facultyDetails)
    .where(
      and(
        eq(schema.facultyDetails.facultyId, facultyId),
        isNotNull(schema.facultyDetails.reviewedAt)
      )
    )
  return pickText(
    lang,
    Object.fromEntries(rows.map((r) => [r.lang as ContentLang, r.description]))
  )
}

async function loadDegrees(
  db: Db,
  facultyId: number,
  lang: Lang
): Promise<FacultyDegree[]> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT d.id, d.type, d.name, d.name_en, d.acronym, d.slug, d.ects,
      d.duration_semesters, d.teaching_language,
      coalesce(ds.course_count, 0) AS course_count,
      coalesce(ds.feedback_count, 0) AS feedback_count,
      coalesce((
        SELECT json_agg(c.name ORDER BY c.name)
        FROM mtm_degrees__campuses m JOIN campuses c ON c.id = m.campus_id
        WHERE m.degree_id = d.id
      ), '[]'::json) AS campuses
    FROM degrees d
    LEFT JOIN degree_stats ds ON ds.degree_id = d.id
    WHERE d.faculty_id = ${facultyId} AND coalesce(ds.course_count, 0) > 0
    ORDER BY coalesce(ds.feedback_count, 0) DESC, d.acronym
  `)
  return rows.map((r) => ({
    id: Number(r.id),
    type: r.type as DegreeType,
    name: pickName(lang, String(r.name), r.name_en as string | null).value,
    acronym: String(r.acronym),
    slug: (r.slug as string | null) ?? null,
    courseCount: Number(r.course_count),
    feedbackCount: Number(r.feedback_count),
    ects: num(r.ects),
    durationSemesters: num(r.duration_semesters),
    teachingLanguage: (r.teaching_language as string | null) ?? null,
    campuses: (r.campuses as string[]) ?? []
  }))
}

async function loadCampuses(
  db: Db,
  facultyId: number
): Promise<FacultyCampus[]> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT c.*, (
      SELECT count(*) FROM mtm_degrees__campuses m
      JOIN degree_stats ds ON ds.degree_id = m.degree_id AND ds.course_count > 0
      WHERE m.campus_id = c.id
    ) AS degree_count
    FROM campuses c WHERE c.faculty_id = ${facultyId}
    ORDER BY degree_count DESC, c.name
  `)
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    address: (r.address as string | null) ?? null,
    postalCode: (r.postal_code as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    latitude: num(r.latitude),
    longitude: num(r.longitude),
    phone: (r.phone as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    degreeCount: Number(r.degree_count)
  }))
}

/**
 * Courses still taught, with stats; a course shared by several degrees
 * (one row per degree) counts once, as its most-reviewed row.
 */
async function loadHighlights(
  db: Db,
  facultyId: number,
  degreeTypes: DegreeType[] | null
): Promise<FacultyHighlights> {
  const typeFilter = degreeTypes
    ? sql`AND d.type IN (${sql.join(
        degreeTypes.map((t) => sql`${t}`),
        sql`, `
      )})`
    : sql``
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT DISTINCT ON (lower(c.name)) c.id, c.name,
      cs.average_rating AS rating, cs.average_workload AS workload,
      cs.total_feedback_count AS n
    FROM courses c
    JOIN degrees d ON d.id = c.degree_id
    JOIN course_stats cs ON cs.course_id = c.id
    WHERE d.faculty_id = ${facultyId} ${typeFilter}
      AND c.last_taught_year IS NULL
      AND cs.total_feedback_count >= ${FACULTY_HIGHLIGHT_MIN_FEEDBACK}
      AND cs.average_rating IS NOT NULL AND cs.average_workload IS NOT NULL
    ORDER BY lower(c.name), cs.total_feedback_count DESC
  `)
  const courses: FacultyCourseStat[] = rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    rating: Number(r.rating),
    workload: Number(r.workload),
    feedbackCount: Number(r.n)
  }))
  const top = (sorted: FacultyCourseStat[]) => sorted.slice(0, HIGHLIGHT_SIZE)
  return {
    mostFeedback: top(
      [...courses].sort((a, b) => b.feedbackCount - a.feedbackCount)
    ),
    best: top(
      [...courses].sort(
        (a, b) => b.rating - a.rating || b.feedbackCount - a.feedbackCount
      )
    ),
    // Workload is inverted: 1 = very heavy
    heaviest: top(
      [...courses].sort(
        (a, b) => a.workload - b.workload || b.feedbackCount - a.feedbackCount
      )
    )
  }
}

async function countFeedback(db: Db, facultyId: number): Promise<number> {
  const [row] = await db.execute<{ n: number }>(sql`
    SELECT count(*)::int AS n FROM feedback f
    JOIN courses c ON c.id = f.course_id
    JOIN degrees d ON d.id = c.degree_id
    WHERE d.faculty_id = ${facultyId} AND f.approved_at IS NOT NULL
  `)
  return Number(row?.n ?? 0)
}

/** Latest CNA 1ª fase (and the year before) of each degree with a DGES pair */
async function loadAdmissions(
  db: Db,
  degreeIds: number[]
): Promise<Map<number, DegreeAdmissionSummary>> {
  const out = new Map<number, DegreeAdmissionSummary>()
  if (degreeIds.length === 0) return out
  const rows = await db.execute<Record<string, unknown>>(sql`
    WITH per_year AS (
      SELECT e.degree_id, a.year, sum(a.vagas) AS vagas,
        sum(a.colocados) AS colocados, min(a.last_grade) AS last_grade,
        row_number() OVER (PARTITION BY e.degree_id ORDER BY a.year DESC) AS k
      FROM sources.degree_external_ids e
      JOIN sources.dges_admissions a
        ON e.external_id = a.unit_code || '/' || a.course_code AND a.fase = 1
      WHERE e.source = 'dges' AND e.degree_id IN (${sql.join(
        degreeIds.map((id) => sql`${id}`),
        sql`, `
      )})
      GROUP BY e.degree_id, a.year
    )
    SELECT cur.degree_id, cur.year, cur.vagas, cur.colocados, cur.last_grade,
      prev.year AS prev_year, prev.last_grade AS prev_grade
    FROM per_year cur
    LEFT JOIN per_year prev ON prev.degree_id = cur.degree_id AND prev.k = 2
    WHERE cur.k = 1
  `)
  for (const r of rows) {
    out.set(Number(r.degree_id), {
      year: Number(r.year),
      vagas: num(r.vagas),
      colocados: num(r.colocados),
      lastGrade: num(r.last_grade),
      previousYear: num(r.prev_year),
      previousGrade: num(r.prev_grade)
    })
  }
  return out
}

/**
 * Latest InfoCursos unemployment and completion per degree, through its
 * 'infocursos' id (mestrados) or else its DGES pair. A suppressed figure
 * (small courses) is null and left out.
 */
async function loadOutcomes(
  db: Db,
  degreeIds: number[]
): Promise<
  Map<number, { employability: number | null; completion: number | null }>
> {
  const out = new Map<
    number,
    { employability: number | null; completion: number | null }
  >()
  if (degreeIds.length === 0) return out
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT DISTINCT ON (e.degree_id, i.indicator) e.degree_id, i.indicator,
      i.data->>'rate' AS rate,
      i.data->'percentages'->>'expected_time' AS expected_time
    FROM sources.degree_external_ids e
    JOIN sources.infocursos_indicators i
      ON e.external_id = i.unit_code || '/' || i.course_code
    WHERE e.source IN ('infocursos', 'dges')
      AND e.degree_id IN (${sql.join(
        degreeIds.map((id) => sql`${id}`),
        sql`, `
      )})
      AND i.indicator IN ('unemployment', 'completion')
    ORDER BY e.degree_id, i.indicator,
      (e.source = 'infocursos') DESC, i.edition DESC
  `)
  for (const r of rows) {
    const id = Number(r.degree_id)
    const entry = out.get(id) ?? { employability: null, completion: null }
    if (r.indicator === 'unemployment') {
      const rate = num(r.rate)
      if (rate !== null) entry.employability = 100 - rate
    } else {
      entry.completion = num(r.expected_time)
    }
    out.set(id, entry)
  }
  return out
}

/** Each degree's latest fee: national students, or one price for everyone */
async function loadFees(
  db: Db,
  degreeIds: number[]
): Promise<Map<number, DegreeFeeSummary>> {
  const out = new Map<number, DegreeFeeSummary>()
  if (degreeIds.length === 0) return out
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT DISTINCT ON (f.degree_id) f.degree_id, f.school_year,
      f.student_type, f.period, f.amount_eur
    FROM degree_fees f
    WHERE f.student_type IN ('national', 'all')
      AND f.degree_id IN (${sql.join(
        degreeIds.map((id) => sql`${id}`),
        sql`, `
      )})
    ORDER BY f.degree_id, f.school_year DESC, (f.student_type = 'national') DESC
  `)
  for (const r of rows) {
    out.set(Number(r.degree_id), {
      schoolYear: Number(r.school_year),
      studentType: String(r.student_type),
      period: String(r.period),
      amountEur: Number(r.amount_eur)
    })
  }
  return out
}

async function loadDescribed(db: Db, degreeIds: number[], lang: Lang) {
  if (degreeIds.length === 0) return new Set<number>()
  const rows = await db.execute<{ degree_id: number }>(sql`
    SELECT degree_id FROM degree_details
    WHERE lang = ${lang} AND reviewed_at IS NOT NULL
      AND degree_id IN (${sql.join(
        degreeIds.map((id) => sql`${id}`),
        sql`, `
      )})
  `)
  return new Set(rows.map((r) => Number(r.degree_id)))
}

/**
 * First-year courses that several licenciaturas share by name (IST's common
 * maths). Stats are the most-reviewed row of each.
 */
async function loadSharedFirstYear(
  db: Db,
  facultyId: number
): Promise<SharedFirstYearCourse[]> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT min(c.name) AS name,
      (array_agg(c.id ORDER BY coalesce(cs.total_feedback_count, 0) DESC))[1] AS course_id,
      count(DISTINCT d.id) AS degree_count,
      (array_agg(cs.average_rating ORDER BY coalesce(cs.total_feedback_count, 0) DESC))[1] AS rating,
      (array_agg(cs.average_workload ORDER BY coalesce(cs.total_feedback_count, 0) DESC))[1] AS workload,
      max(coalesce(cs.total_feedback_count, 0)) AS n
    FROM courses c
    JOIN degrees d ON d.id = c.degree_id AND d.type = 'bachelor'
    JOIN degree_stats ds ON ds.degree_id = d.id AND ds.course_count > 0
    JOIN course_offerings o ON o.course_id = c.id AND o.curriculum_year = 1
    LEFT JOIN course_stats cs ON cs.course_id = c.id
    WHERE d.faculty_id = ${facultyId} AND c.last_taught_year IS NULL
    GROUP BY lower(c.name)
    HAVING count(DISTINCT d.id) >= 3
    ORDER BY degree_count DESC, n DESC
    LIMIT 10
  `)
  return rows.map((r) => ({
    name: String(r.name),
    courseId: Number(r.course_id),
    degreeCount: Number(r.degree_count),
    rating: num(r.rating),
    workload: num(r.workload),
    feedbackCount: Number(r.n)
  }))
}

/** `continues_to` links that start or end at this faculty's degrees */
async function loadPathways(
  db: Db,
  degreeIds: number[]
): Promise<DegreePathway[]> {
  if (degreeIds.length === 0) return []
  const ids = sql.join(
    degreeIds.map((id) => sql`${id}`),
    sql`, `
  )
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT s.acronym AS from_acronym, s.slug AS from_slug,
      t.acronym AS to_acronym, t.slug AS to_slug, tf.slug AS to_faculty_slug
    FROM degree_relationships r
    JOIN degrees s ON s.id = r.source_degree_id
    JOIN degrees t ON t.id = r.target_degree_id
    JOIN faculties tf ON tf.id = t.faculty_id
    WHERE r.relationship_type = 'continues_to'
      AND (r.source_degree_id IN (${ids}) OR r.target_degree_id IN (${ids}))
      AND s.slug IS NOT NULL AND t.slug IS NOT NULL AND tf.slug IS NOT NULL
    ORDER BY s.acronym, t.acronym
  `)
  return rows.map((r) => ({
    fromAcronym: String(r.from_acronym),
    fromSlug: String(r.from_slug),
    toAcronym: String(r.to_acronym),
    toSlug: String(r.to_slug),
    toFacultySlug: String(r.to_faculty_slug)
  }))
}

export async function loadFacultyHub(
  faculty: Faculty,
  lang: Lang
): Promise<FacultyHubData> {
  const db = database()
  const [university, degrees, campuses, feedbackCount, intro, links] =
    await Promise.all([
      loadUniversity(db, faculty.universityId, lang),
      loadDegrees(db, faculty.id, lang),
      loadCampuses(db, faculty.id),
      countFeedback(db, faculty.id),
      loadIntro(db, faculty.id, lang),
      loadOfficialLinks('faculty', faculty.id)
    ])

  // Entry summary over the licenciaturas (CNA)
  const bachelorIds = degrees
    .filter((d) => d.type === 'bachelor')
    .map((d) => d.id)
  const [admissions, fees] = await Promise.all([
    loadAdmissions(db, bachelorIds),
    loadFees(db, bachelorIds)
  ])
  const latestYear = Math.max(0, ...[...admissions.values()].map((a) => a.year))
  const current = degrees
    .map((d) => ({ degree: d, admission: admissions.get(d.id) }))
    .filter(
      (x): x is { degree: FacultyDegree; admission: DegreeAdmissionSummary } =>
        x.admission !== undefined && x.admission.year === latestYear
    )
  const graded = current
    .filter((x) => x.admission.lastGrade !== null)
    .sort((a, b) => b.admission.lastGrade! - a.admission.lastGrade!)
  const bachelorFees = [...fees.values()]
  const admissionSummary =
    current.length > 0
      ? {
          year: latestYear,
          degreeCount: current.length,
          vagas: current.reduce((s, x) => s + (x.admission.vagas ?? 0), 0),
          highest: graded[0]
            ? {
                acronym: graded[0].degree.acronym,
                grade: graded[0].admission.lastGrade!
              }
            : null,
          lowest:
            graded.length > 1
              ? {
                  acronym: graded.at(-1)!.degree.acronym,
                  grade: graded.at(-1)!.admission.lastGrade!
                }
              : null,
          // One national fee for every licenciatura (public universities)
          fee:
            bachelorFees.length > 0 &&
            bachelorFees.every(
              (f) =>
                f.amountEur === bachelorFees[0].amountEur &&
                f.period === bachelorFees[0].period
            )
              ? bachelorFees[0]
              : null
        }
      : null

  return {
    university,
    degrees,
    campuses,
    feedbackCount,
    admissionSummary,
    intro,
    isMostlyFallback: isMostlyFallback([intro]),
    links
  }
}

export async function loadFacultyTypePage(
  faculty: Faculty,
  type: DegreeType,
  lang: Lang
): Promise<FacultyTypePageData> {
  const db = database()
  const [university, allDegrees, campuses, highlights] = await Promise.all([
    loadUniversity(db, faculty.universityId, lang),
    loadDegrees(db, faculty.id, lang),
    loadCampuses(db, faculty.id),
    loadHighlights(db, faculty.id, [type])
  ])
  const degrees = allDegrees.filter((d) => d.type === type)
  const ids = degrees.map((d) => d.id)
  const [admissions, outcomes, fees, described, firstYear, pathways] =
    await Promise.all([
      loadAdmissions(db, ids),
      loadOutcomes(db, ids),
      loadFees(db, ids),
      loadDescribed(db, ids, lang),
      type === 'bachelor'
        ? loadSharedFirstYear(db, faculty.id)
        : Promise.resolve([]),
      type === 'bachelor' || type === 'master' || type === 'integrated_master'
        ? loadPathways(db, ids)
        : Promise.resolve([])
    ])

  const rows: TypePageDegree[] = degrees.map((d) => ({
    ...d,
    admission: admissions.get(d.id) ?? null,
    employability: outcomes.get(d.id)?.employability ?? null,
    completion: outcomes.get(d.id)?.completion ?? null,
    fee: fees.get(d.id) ?? null,
    hasDescription: described.has(d.id)
  }))

  // The other type pages this faculty has, for "related" links
  const otherTypes = [...new Set(allDegrees.map((d) => d.type))].filter(
    (t) => t !== type
  )

  return {
    university,
    degrees: rows,
    campuses,
    highlights,
    firstYear,
    pathways,
    otherTypes
  }
}
