import { database, schema } from '@uni-feedback/db'
import { and, desc, eq, inArray, or } from 'drizzle-orm'
import type {
  AdmissionYear,
  DegreeAdmissionPageData,
  DegreeCareersPageData,
  DegreeFeeHistoryRow,
  UnemploymentWindow
} from '~/components/degree/pageTypes'
import { toNumber, type Pair } from './degreePage.server'

/**
 * What the degree sub-pages read beyond the degree page's extras
 * (prds/content_rich_pages.md, decision 22): every fase of every year, the
 * whole fee history, and how first-years entered (InfoCursos). Same tables, same rules: nothing guessed, a missing figure is
 * null and the page leaves it out.
 */

type Db = ReturnType<typeof database>
type Json = Record<string, unknown>

const infocursosUrl = (pair: Pair) =>
  pair.url ??
  `https://infocursos.medu.pt/dges.asp?code=${pair.unit}&codc=${pair.course}`

const pctOf = (data: Json): Json => (data.percentages ?? {}) as Json
const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String) : []

/* ------------------------------------------------------------------ */
/* Ingresso                                                            */
/* ------------------------------------------------------------------ */

export async function loadAdmissionPageData(
  degreeId: number,
  sources: {
    dgesPairs: Pair[]
    mainCourseCode: string | null
    outcomesPair: Pair | null
  }
): Promise<DegreeAdmissionPageData> {
  const db = database()
  const mainPairs = sources.mainCourseCode
    ? sources.dgesPairs.filter((p) => p.course === sources.mainCourseCode)
    : []
  const [years, feeHistory] = await Promise.all([
    loadAllFases(db, mainPairs),
    loadFeeHistory(db, degreeId)
  ])

  return { years, feeHistory }
}

/**
 * Every fase of every year of the main track. Pre-2014 ULisboa units (IST 0807)
 * and today's (1518) are one track; on a year present under both, the most
 * recent unit wins, as on the degree page.
 */
async function loadAllFases(db: Db, pairs: Pair[]): Promise<AdmissionYear[]> {
  if (pairs.length === 0) return []
  const rows = await db
    .select({
      unit: schema.dgesAdmissions.unitCode,
      year: schema.dgesAdmissions.year,
      fase: schema.dgesAdmissions.fase,
      vagas: schema.dgesAdmissions.vagas,
      colocados: schema.dgesAdmissions.colocados,
      lastGrade: schema.dgesAdmissions.lastGrade
    })
    .from(schema.dgesAdmissions)
    .where(
      or(
        ...pairs.map((p) =>
          and(
            eq(schema.dgesAdmissions.unitCode, p.unit),
            eq(schema.dgesAdmissions.courseCode, p.course)
          )
        )
      )
    )
  if (rows.length === 0) return []

  const latestUnit = rows.reduce((a, b) => (b.year > a.year ? b : a)).unit
  const byKey = new Map<string, (typeof rows)[number]>()
  for (const row of rows) {
    const key = `${row.year}-${row.fase}`
    const existing = byKey.get(key)
    if (!existing || row.unit === latestUnit) byKey.set(key, row)
  }

  const byYear = new Map<number, AdmissionYear>()
  for (const row of byKey.values()) {
    const entry = byYear.get(row.year) ?? { year: row.year, fases: [] }
    entry.fases.push({
      fase: row.fase,
      vagas: row.vagas,
      colocados: row.colocados,
      lastGrade: row.lastGrade !== null ? Number(row.lastGrade) : null
    })
    byYear.set(row.year, entry)
  }
  return [...byYear.values()]
    .map((y) => ({ ...y, fases: y.fases.sort((a, b) => a.fase - b.fase) }))
    .sort((a, b) => b.year - a.year)
}

const STUDENT_TYPE_ORDER = ['national', 'all', 'international']

async function loadFeeHistory(
  db: Db,
  degreeId: number
): Promise<DegreeFeeHistoryRow[]> {
  const rows = await db
    .select({
      schoolYear: schema.degreeFees.schoolYear,
      studentType: schema.degreeFees.studentType,
      period: schema.degreeFees.period,
      amountEur: schema.degreeFees.amountEur,
      sourceUrl: schema.degreeFees.sourceUrl
    })
    .from(schema.degreeFees)
    .where(eq(schema.degreeFees.degreeId, degreeId))
  return rows
    .map((r) => ({ ...r, amountEur: Number(r.amountEur) }))
    .sort(
      (a, b) =>
        b.schoolYear - a.schoolYear ||
        STUDENT_TYPE_ORDER.indexOf(a.studentType) -
          STUDENT_TYPE_ORDER.indexOf(b.studentType)
    )
}

/* ------------------------------------------------------------------ */
/* Saídas profissionais                                                */
/* ------------------------------------------------------------------ */

export async function loadCareersPageData(
  outcomesPair: Pair | null
): Promise<DegreeCareersPageData> {
  if (!outcomesPair) {
    return {
      unemploymentHistory: [],
      completion: null,
      statusAfter1Year: null,
      finalGrades: null,
      infocursos: null
    }
  }
  const db = database()
  const [history, latest] = await Promise.all([
    db
      .select({
        edition: schema.infocursosIndicators.edition,
        data: schema.infocursosIndicators.data
      })
      .from(schema.infocursosIndicators)
      .where(
        and(
          eq(schema.infocursosIndicators.unitCode, outcomesPair.unit),
          eq(schema.infocursosIndicators.courseCode, outcomesPair.course),
          eq(schema.infocursosIndicators.indicator, 'unemployment')
        )
      )
      .orderBy(desc(schema.infocursosIndicators.edition)),
    loadLatestIndicators(db, outcomesPair, [
      'completion',
      'status_after_1_year',
      'final_grades'
    ])
  ])

  // Two editions can publish the same graduation window (2023 and 2024 do):
  // keep the newest edition of each window
  const windows = new Map<string, UnemploymentWindow>()
  for (const row of history) {
    const data = row.data as Json
    const rate = toNumber(data.rate)
    if (rate === null) continue
    const years = (data.graduation_years ?? {}) as Json
    const from = typeof years.from === 'string' ? years.from : null
    const to = typeof years.to === 'string' ? years.to : null
    const key = from && to ? `${from}-${to}` : `edition-${row.edition}`
    if (windows.has(key)) continue
    windows.set(key, {
      edition: row.edition,
      from,
      to,
      graduates: toNumber(data.graduates),
      unemployed: toNumber(data.unemployed),
      rate
    })
  }

  const get = (name: string) => latest.find((r) => r.indicator === name)

  const c = get('completion')
  const cp = c ? pctOf(c.data) : null
  const s = get('status_after_1_year')
  const sp = s ? pctOf(s.data) : null
  const g = get('final_grades')
  const distribution = Array.isArray(g?.data.distribution)
    ? (g!.data.distribution as Json[])
        .map((d) => ({
          grade: toNumber(d.grade),
          percent: toNumber(d.percent)
        }))
        .filter(
          (d): d is { grade: number; percent: number } =>
            d.grade !== null && d.percent !== null
        )
    : []

  const editions = [
    ...history.map((h) => h.edition),
    ...latest.map((r) => r.edition)
  ]

  return {
    unemploymentHistory: [...windows.values()],
    completion:
      c && cp
        ? {
            cohortYear:
              typeof c.data.cohort_year === 'string'
                ? c.data.cohort_year
                : null,
            firstYearStudents: toNumber(c.data.first_year_students),
            durationYears: toNumber(c.data.duration_years),
            expectedTime: toNumber(cp.expected_time),
            plus1Year: toNumber(cp.plus_1_year),
            plus3Years: toNumber(cp.plus_3_years)
          }
        : null,
    statusAfter1Year:
      s && sp
        ? {
            students: toNumber(s.data.students),
            sameCourse: toNumber(sp.same_course),
            otherCourseSameInstitution: toNumber(
              sp.other_course_same_institution
            ),
            otherInstitution: toNumber(sp.other_institution),
            graduated: toNumber(sp.graduated),
            notFound: toNumber(sp.not_found)
          }
        : null,
    finalGrades: g
      ? {
          average: toNumber(g.data.average_grade),
          graduates: toNumber(g.data.graduates),
          schoolYears: stringList(g.data.school_years),
          distribution
        }
      : null,
    infocursos:
      editions.length > 0
        ? { url: infocursosUrl(outcomesPair), edition: Math.max(...editions) }
        : null
  }
}

/** The latest edition of each of these InfoCursos indicators. */
async function loadLatestIndicators(db: Db, pair: Pair, indicators: string[]) {
  const rows = await db
    .selectDistinctOn([schema.infocursosIndicators.indicator], {
      indicator: schema.infocursosIndicators.indicator,
      edition: schema.infocursosIndicators.edition,
      data: schema.infocursosIndicators.data
    })
    .from(schema.infocursosIndicators)
    .where(
      and(
        eq(schema.infocursosIndicators.unitCode, pair.unit),
        eq(schema.infocursosIndicators.courseCode, pair.course),
        inArray(schema.infocursosIndicators.indicator, indicators)
      )
    )
    .orderBy(
      schema.infocursosIndicators.indicator,
      desc(schema.infocursosIndicators.edition)
    )
  return rows.map((r) => ({ ...r, data: (r.data ?? {}) as Json }))
}
