import { database, schema } from '@uni-feedback/db'
import type { DegreeType } from '@uni-feedback/db/schema'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { and, asc, desc, eq, inArray, isNotNull, or, sql } from 'drizzle-orm'
import type {
  AdmissionGuide,
  AdmissionTrack,
  DegreeAdmissions,
  DegreeCampusInfo,
  DegreeFees,
  DegreeOutcomes,
  DegreePageExtras,
  DegreeRelationshipType,
  RelatedDegree
} from '~/components/degree/pageTypes'
import type { Lang } from '~/i18n/config'
import { pickName } from '~/utils/localizedContent'
import { lisbonToday, loadApplyRoutes } from './admissionRoutes.server'

/**
 * The degree page's content sections beyond the course plan (v2): campus,
 * admission (DGES), fees, outcomes (InfoCursos) and related degrees.
 *
 * Lean on purpose: one query for the external ids, then the rest in parallel,
 * each reading only the rows the page shows (the 1ª fase of the admission
 * results, the latest guide snapshot, the latest InfoCursos edition, this school
 * year's fees). Where each table comes from and its caveats:
 * `docs/data-model/degree_content_data.md` in the workspace.
 */

type Db = ReturnType<typeof database>

export interface Pair {
  unit: string
  course: string
  url: string | null
}

function parsePair(externalId: string, url: string | null): Pair | null {
  const [unit, course] = externalId.split('/')
  return unit && course ? { unit, course, url } : null
}

const AFTER_WORK = /p[óo]s-laboral/i

export const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** The degree as the extras loaders need it */
export type ExtrasDegree = {
  id: number
  type: DegreeType
  facultyId: number | null
}

export async function loadDegreePageExtras(
  degree: ExtrasDegree,
  facultyUniversityId: number | null,
  lang: Lang
): Promise<DegreePageExtras> {
  return (await loadDegreeExtrasWithSources(degree, facultyUniversityId, lang))
    .extras
}

/**
 * The degree page's extras plus the official ids they were read from, for the
 * sub-pages (`/ingresso`, `/saidas-profissionais`) that read more of the same
 * tables: every DGES pair, the main admission track's course code, and the
 * InfoCursos pair the outcomes come from.
 */
export async function loadDegreeExtrasWithSources(
  degree: ExtrasDegree,
  facultyUniversityId: number | null,
  lang: Lang
): Promise<{
  extras: DegreePageExtras
  dgesPairs: Pair[]
  mainCourseCode: string | null
  outcomesPair: Pair | null
}> {
  const db = database()
  const degreeId = degree.id

  const externalIds = await db
    .select({
      source: schema.degreeExternalIds.source,
      externalId: schema.degreeExternalIds.externalId,
      url: schema.degreeExternalIds.url
    })
    .from(schema.degreeExternalIds)
    .where(
      and(
        eq(schema.degreeExternalIds.degreeId, degreeId),
        inArray(schema.degreeExternalIds.source, ['dges', 'infocursos'])
      )
    )

  const dgesPairs = externalIds
    .filter((e) => e.source === 'dges')
    .map((e) => parsePair(e.externalId, e.url))
    .filter((p): p is Pair => p !== null)
  const infocursosPairs = externalIds
    .filter((e) => e.source === 'infocursos')
    .map((e) => parsePair(e.externalId, e.url))
    .filter((p): p is Pair => p !== null)

  const [universityName, campuses, admissionsResult, fees, related] =
    await Promise.all([
      loadUniversityName(db, facultyUniversityId, lang),
      loadCampuses(db, degreeId),
      loadAdmissions(db, dgesPairs),
      loadFees(db, degreeId),
      loadRelated(db, degreeId, lang)
    ])

  const admissions = admissionsResult?.admissions ?? null
  const today = lisbonToday()
  // The national calendar only for a degree that is in the Concurso Nacional
  const applyRoutesQuery = loadApplyRoutes(
    db,
    degree,
    lang,
    today,
    admissions !== null
  )

  // InfoCursos uses the same (unit, course) pair as DGES. An explicit
  // 'infocursos' id wins (mestrados, which have no DGES pair); otherwise the
  // main admission track's current pair.
  const outcomesPair =
    infocursosPairs[0] ?? admissionsResult?.currentPair ?? dgesPairs[0] ?? null
  const [outcomes, sharingDegrees] = outcomesPair
    ? await Promise.all([
        loadOutcomes(db, outcomesPair),
        // An InfoCursos programme can cover several of our degrees
        infocursosPairs[0]
          ? db
              .select({ count: sql<number>`count(*)::int` })
              .from(schema.degreeExternalIds)
              .where(
                and(
                  eq(schema.degreeExternalIds.source, 'infocursos'),
                  eq(
                    schema.degreeExternalIds.externalId,
                    `${infocursosPairs[0].unit}/${infocursosPairs[0].course}`
                  )
                )
              )
              .then(([row]) => row?.count ?? 1)
          : Promise.resolve(1)
      ])
    : [null, 1]
  if (outcomes && sharingDegrees <= 1) outcomes.broaderProgramme = null
  const applyRoutes = await applyRoutesQuery

  return {
    extras: {
      universityName,
      campuses,
      admissions,
      fees,
      outcomes,
      related,
      applyRoutes,
      today
    },
    dgesPairs,
    mainCourseCode: admissions?.main.courseCode ?? null,
    outcomesPair
  }
}

async function loadUniversityName(
  db: Db,
  universityId: number | null,
  lang: Lang
): Promise<string | null> {
  if (!universityId) return null
  const [row] = await db
    .select({
      name: schema.universities.name,
      nameEn: schema.universities.nameEn
    })
    .from(schema.universities)
    .where(eq(schema.universities.id, universityId))
  return row ? pickName(lang, row.name, row.nameEn).value : null
}

async function loadCampuses(
  db: Db,
  degreeId: number
): Promise<DegreeCampusInfo[]> {
  return db
    .select({
      id: schema.campuses.id,
      name: schema.campuses.name,
      address: schema.campuses.address,
      postalCode: schema.campuses.postalCode,
      city: schema.campuses.city,
      latitude: schema.campuses.latitude,
      longitude: schema.campuses.longitude,
      phone: schema.campuses.phone,
      email: schema.campuses.email,
      url: schema.campuses.url
    })
    .from(schema.degreesCampuses)
    .innerJoin(
      schema.campuses,
      eq(schema.campuses.id, schema.degreesCampuses.campusId)
    )
    .where(eq(schema.degreesCampuses.degreeId, degreeId))
    .orderBy(asc(schema.campuses.name))
}

/**
 * The Concurso Nacional block. A degree can have several DGES pairs:
 * - the same course code under an old unit code (pre-2014 ULisboa units such as
 *   IST 0807): merged into one track, which is what gives the long history;
 * - a different course code for the pós-laboral regime (FDUL Direito, ISCTE):
 *   kept as its own track. The daytime one drives the stats and the chart, and
 *   each pós-laboral track gets a one-line summary.
 */
async function loadAdmissions(
  db: Db,
  pairs: Pair[]
): Promise<{ admissions: DegreeAdmissions; currentPair: Pair } | null> {
  if (pairs.length === 0) return null

  const [rows, guides] = await Promise.all([
    db
      .select({
        unit: schema.dgesAdmissions.unitCode,
        course: schema.dgesAdmissions.courseCode,
        year: schema.dgesAdmissions.year,
        vagas: schema.dgesAdmissions.vagas,
        lastGrade: schema.dgesAdmissions.lastGrade,
        courseName: schema.dgesAdmissions.courseName
      })
      .from(schema.dgesAdmissions)
      .where(
        and(
          eq(schema.dgesAdmissions.fase, 1),
          or(
            ...pairs.map((p) =>
              and(
                eq(schema.dgesAdmissions.unitCode, p.unit),
                eq(schema.dgesAdmissions.courseCode, p.course)
              )
            )
          )
        )
      )
      .orderBy(asc(schema.dgesAdmissions.year)),
    // The latest snapshot of each pair's guide page
    db
      .selectDistinctOn(
        [schema.dgesGuide.unitCode, schema.dgesGuide.courseCode],
        {
          unit: schema.dgesGuide.unitCode,
          course: schema.dgesGuide.courseCode,
          year: schema.dgesGuide.year,
          data: schema.dgesGuide.data,
          sourceUrl: schema.dgesGuide.sourceUrl
        }
      )
      .from(schema.dgesGuide)
      .where(
        or(
          ...pairs.map((p) =>
            and(
              eq(schema.dgesGuide.unitCode, p.unit),
              eq(schema.dgesGuide.courseCode, p.course)
            )
          )
        )
      )
      .orderBy(
        schema.dgesGuide.unitCode,
        schema.dgesGuide.courseCode,
        desc(schema.dgesGuide.year)
      )
  ])

  // Group by course code. Within a track, the unit with the latest row is the
  // current one; on a year present under two units, the current unit wins.
  const byCourse = new Map<
    string,
    { rows: typeof rows; latestUnit: string; latestYear: number; name: string }
  >()
  for (const row of rows) {
    const entry = byCourse.get(row.course) ?? {
      rows: [],
      latestUnit: row.unit,
      latestYear: row.year,
      name: row.courseName ?? ''
    }
    entry.rows.push(row)
    if (row.year >= entry.latestYear) {
      entry.latestYear = row.year
      entry.latestUnit = row.unit
      entry.name = row.courseName ?? entry.name
    }
    byCourse.set(row.course, entry)
  }

  // Guides for courses with no results rows still count (a brand new degree)
  for (const guide of guides) {
    if (!byCourse.has(guide.course)) {
      byCourse.set(guide.course, {
        rows: [],
        latestUnit: guide.unit,
        latestYear: guide.year,
        name: String((guide.data as Record<string, unknown>)?.course_name ?? '')
      })
    }
  }
  if (byCourse.size === 0) return null

  const tracks = [...byCourse.entries()].map(([courseCode, entry]) => {
    const perYear = new Map<number, (typeof rows)[number]>()
    for (const row of entry.rows) {
      const existing = perYear.get(row.year)
      if (!existing || row.unit === entry.latestUnit) perYear.set(row.year, row)
    }
    const track: AdmissionTrack & { latestUnit: string; latestYear: number } = {
      courseCode,
      isAfterWork: AFTER_WORK.test(entry.name),
      series: [...perYear.values()]
        .filter((r) => r.lastGrade !== null)
        .sort((a, b) => a.year - b.year)
        .map((r) => ({
          year: r.year,
          grade: Number(r.lastGrade),
          vagas: r.vagas
        })),
      latestUnit: entry.latestUnit,
      latestYear: entry.latestYear
    }
    return track
  })

  // The main track: the most recent daytime one (most recent of any if every
  // track is pós-laboral, which none is today)
  const byRecency = [...tracks].sort((a, b) => b.latestYear - a.latestYear)
  const main = byRecency.find((t) => !t.isAfterWork) ?? byRecency[0]
  const afterWork = tracks.filter(
    (t) => t !== main && t.isAfterWork && t.series.length > 0
  )

  const guideRow =
    guides.find(
      (g) => g.course === main.courseCode && g.unit === main.latestUnit
    ) ?? guides.find((g) => g.course === main.courseCode)
  const guide = guideRow ? parseGuide(guideRow) : null

  if (main.series.length === 0 && !guide) return null

  const currentPair = pairs.find(
    (p) => p.unit === main.latestUnit && p.course === main.courseCode
  ) ?? { unit: main.latestUnit, course: main.courseCode, url: null }
  const dgesUrl =
    currentPair.url ??
    guideRow?.sourceUrl ??
    `https://www.dges.gov.pt/guias/detcursopi.asp?codc=${main.courseCode}&code=${main.latestUnit}`

  const strip = ({
    courseCode,
    isAfterWork,
    series
  }: AdmissionTrack): AdmissionTrack => ({ courseCode, isAfterWork, series })

  return {
    admissions: {
      main: strip(main),
      afterWork: afterWork.map(strip),
      guide,
      dgesUrl
    },
    currentPair
  }
}

function parseGuide(row: {
  year: number
  data: unknown
  sourceUrl: string
}): AdmissionGuide {
  const data = (row.data ?? {}) as Record<string, unknown>

  const next = data.next_year_vagas as
    | { vagas?: unknown; academic_year?: unknown }
    | null
    | undefined
  const nextVagas = toNumber(next?.vagas)

  const combos = Array.isArray(data.provas)
    ? (data.provas as unknown[])
        .filter(Array.isArray)
        .map((combo) =>
          (combo as { name?: unknown }[])
            .map((exam) => (typeof exam?.name === 'string' ? exam.name : null))
            .filter((name): name is string => name !== null)
        )
        .filter((combo) => combo.length > 0)
    : []
  // The exam every combination shares goes first ("Matemática A + Física e
  // Química", not DGES's code order), the rest alphabetically
  const shared = (name: string) => combos.every((combo) => combo.includes(name))
  const provas = combos.map((combo) =>
    [...combo].sort(
      (a, b) =>
        Number(shared(b)) - Number(shared(a)) || a.localeCompare(b, 'pt')
    )
  )

  const formula = data.formula as
    | { secondary_average_pct?: unknown; entry_exams_pct?: unknown }
    | null
    | undefined
  const secondaryPct = toNumber(formula?.secondary_average_pct)
  const examsPct = toNumber(formula?.entry_exams_pct)

  const minimum = data.minimum_grades as
    | { application?: unknown; entry_exams?: unknown }
    | null
    | undefined

  // Only the courses that require them (Medicina, Medicina Dentária, ...):
  // { type: 'Seleção', lines: ['Grupo A - Comunicação interpessoal'] }
  const prereq = data.prerequisites as
    | { type?: unknown; lines?: unknown }
    | null
    | undefined
  const prerequisiteLines = Array.isArray(prereq?.lines)
    ? prereq.lines.map(String).filter(Boolean)
    : []

  return {
    year: row.year,
    nextYearVagas:
      nextVagas !== null
        ? {
            vagas: nextVagas,
            academicYear: String(next?.academic_year ?? '')
          }
        : null,
    provas,
    formula:
      secondaryPct !== null && examsPct !== null
        ? { secondaryPct, examsPct }
        : null,
    minimumGrades: {
      application: toNumber(minimum?.application),
      entryExams: toNumber(minimum?.entry_exams)
    },
    prerequisites:
      prerequisiteLines.length > 0
        ? {
            type: typeof prereq?.type === 'string' ? prereq.type : null,
            lines: prerequisiteLines
          }
        : null,
    sourceUrl: row.sourceUrl
  }
}

const STUDENT_TYPE_ORDER = ['national', 'all', 'international']
const PERIOD_ORDER = ['year', 'semester', 'ects', 'total']

/** This school year's fees only (2026 = 2026/27); the history stays unshown. */
async function loadFees(db: Db, degreeId: number): Promise<DegreeFees | null> {
  const schoolYear = getCurrentSchoolYear()
  const rows = await db
    .select({
      studentType: schema.degreeFees.studentType,
      period: schema.degreeFees.period,
      amountEur: schema.degreeFees.amountEur,
      sourceUrl: schema.degreeFees.sourceUrl
    })
    .from(schema.degreeFees)
    .where(
      and(
        eq(schema.degreeFees.degreeId, degreeId),
        eq(schema.degreeFees.schoolYear, schoolYear)
      )
    )
  if (rows.length === 0) return null

  const rank = (list: string[], value: string) => {
    const i = list.indexOf(value)
    return i === -1 ? list.length : i
  }
  return {
    schoolYear,
    rows: rows
      .map((r) => ({
        studentType: r.studentType,
        period: r.period,
        amountEur: Number(r.amountEur)
      }))
      .sort(
        (a, b) =>
          rank(STUDENT_TYPE_ORDER, a.studentType) -
            rank(STUDENT_TYPE_ORDER, b.studentType) ||
          rank(PERIOD_ORDER, a.period) - rank(PERIOD_ORDER, b.period)
      ),
    sourceUrls: [...new Set(rows.map((r) => r.sourceUrl))]
  }
}

/**
 * The latest InfoCursos edition of each indicator the page shows. A suppressed
 * figure (small courses) has a null rate and is left out; we never fall back to
 * an older edition, which would present stale data as current. (The 2024
 * unemployment sheet repeats 2023's: only relevant if 2024 is the latest
 * edition a degree has, which is then labelled as such.)
 */
async function loadOutcomes(
  db: Db,
  pair: Pair
): Promise<DegreeOutcomes | null> {
  const rows = await db
    .selectDistinctOn([schema.infocursosIndicators.indicator], {
      indicator: schema.infocursosIndicators.indicator,
      edition: schema.infocursosIndicators.edition,
      degreeLevel: schema.infocursosIndicators.degreeLevel,
      data: schema.infocursosIndicators.data
    })
    .from(schema.infocursosIndicators)
    .where(
      and(
        eq(schema.infocursosIndicators.unitCode, pair.unit),
        eq(schema.infocursosIndicators.courseCode, pair.course),
        inArray(schema.infocursosIndicators.indicator, [
          'unemployment',
          'completion',
          'status_after_1_year'
        ])
      )
    )
    .orderBy(
      schema.infocursosIndicators.indicator,
      desc(schema.infocursosIndicators.edition)
    )

  const get = (indicator: string) => rows.find((r) => r.indicator === indicator)
  const editions: number[] = []

  let unemployment: DegreeOutcomes['unemployment'] = null
  const u = get('unemployment')
  if (u) {
    const data = u.data as Record<string, unknown>
    const rate = toNumber(data.rate)
    const comparison = (data.comparison ?? {}) as Record<
      string,
      { rate?: unknown } | undefined
    >
    if (rate !== null) {
      unemployment = {
        rate,
        national: toNumber(comparison.national?.rate),
        area: toNumber(comparison.area?.rate)
      }
      editions.push(u.edition)
    }
  }

  let completion: DegreeOutcomes['completion'] = null
  const c = get('completion')
  if (c) {
    const pct = ((c.data as Record<string, unknown>).percentages ??
      {}) as Record<string, unknown>
    const expectedTime = toNumber(pct.expected_time)
    const plus3Years = toNumber(pct.plus_3_years)
    if (expectedTime !== null || plus3Years !== null) {
      completion = { expectedTime, plus3Years }
      editions.push(c.edition)
    }
  }

  let stillInCourse: number | null = null
  const s = get('status_after_1_year')
  if (s) {
    const pct = ((s.data as Record<string, unknown>).percentages ??
      {}) as Record<string, unknown>
    stillInCourse = toNumber(pct.same_course)
    if (stillInCourse !== null) editions.push(s.edition)
  }

  if (editions.length === 0) return null

  // The programme as InfoCursos names it (used when it covers several of our
  // degrees; the caller clears it otherwise)
  const named = rows.find(
    (r) =>
      typeof (r.data as { course?: { name?: unknown } }).course?.name ===
      'string'
  )
  const programmeName = named
    ? String((named.data as { course: { name: string } }).course.name)
    : null

  return {
    edition: Math.max(...editions),
    unemployment,
    completion,
    stillInCourse,
    broaderProgramme: programmeName
      ? { name: programmeName, level: named?.degreeLevel ?? null }
      : null,
    sourceUrl:
      pair.url ??
      `https://infocursos.medu.pt/dges.asp?code=${pair.unit}&codc=${pair.course}`
  }
}

/**
 * Typed links to other degrees. Symmetric types are stored both ways, so this
 * degree as the source finds them all; `continues_to` is directed, so it is
 * read both ways (this degree leads to X / X leads here).
 */
async function loadRelated(
  db: Db,
  degreeId: number,
  lang: Lang
): Promise<RelatedDegree[]> {
  const rel = schema.degreeRelationships
  const rows = await db
    .select({
      sourceDegreeId: rel.sourceDegreeId,
      relationshipType: rel.relationshipType,
      slug: schema.degrees.slug,
      acronym: schema.degrees.acronym,
      name: schema.degrees.name,
      nameEn: schema.degrees.nameEn,
      facultySlug: schema.faculties.slug,
      facultyShortName: schema.faculties.shortName
    })
    .from(rel)
    .innerJoin(
      schema.degrees,
      sql`${schema.degrees.id} = CASE WHEN ${rel.sourceDegreeId} = ${degreeId} THEN ${rel.targetDegreeId} ELSE ${rel.sourceDegreeId} END`
    )
    .innerJoin(
      schema.faculties,
      eq(schema.faculties.id, schema.degrees.facultyId)
    )
    .where(
      and(
        or(
          eq(rel.sourceDegreeId, degreeId),
          and(
            eq(rel.targetDegreeId, degreeId),
            eq(rel.relationshipType, 'continues_to')
          )
        ),
        isNotNull(schema.degrees.slug),
        isNotNull(schema.faculties.slug)
      )
    )

  const known: DegreeRelationshipType[] = [
    'campus_sibling',
    'continues_to',
    'equivalent',
    'similar'
  ]
  return rows
    .map((row) => {
      const type =
        row.relationshipType === 'continues_to' &&
        row.sourceDegreeId !== degreeId
          ? 'continues_from'
          : (row.relationshipType as DegreeRelationshipType)
      return {
        relationship: type,
        facultySlug: row.facultySlug as string,
        facultyShortName: row.facultyShortName,
        slug: row.slug as string,
        acronym: row.acronym,
        name: pickName(lang, row.name, row.nameEn).value
      }
    })
    .filter(
      (r) =>
        r.relationship === 'continues_from' || known.includes(r.relationship)
    )
}
