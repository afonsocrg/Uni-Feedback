import { database, schema } from '@uni-feedback/db'
import type { DegreeType } from '@uni-feedback/db/schema'
import { DEGREE_TYPES } from '@uni-feedback/db/schema'
import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL
} from 'drizzle-orm'
import type {
  AdmissionRoundStatus,
  AdmissionRouteScope,
  AdmissionRouteView
} from '~/components/degree/pageTypes'
import {
  applySectionId,
  hasAdmissionsPage,
  type FacultyApplyData,
  type FacultyApplyDegree,
  type FacultyApplySection
} from '~/components/faculty/admissionsContent'
import { pickName } from '~/utils/localizedContent'

/**
 * How to apply to a degree (prds/content_rich_pages.md, "Ingresso v2"), read
 * by the degree page's Ingresso section, the `/ingresso` sub-page and the
 * faculty's Candidaturas page: the routes in, each with our reviewed guide and
 * the rounds of its latest intake (`admission_guides`, `admission_rounds`,
 * migration 0062). One fetch per page (a degree, or a whole faculty), then the
 * same resolution per degree in memory.
 */

type Db = ReturnType<typeof database>

/** Today's date in Lisbon, as an ISO date: the day a round's status is for. */
export function lisbonToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(
    new Date()
  )
}

function roundStatus(
  opensOn: string | null,
  closesOn: string | null,
  today: string
): AdmissionRoundStatus {
  if (closesOn && closesOn < today) return 'closed'
  if (opensOn && opensOn > today) return 'upcoming'
  if (opensOn || closesOn) return 'open'
  return 'unknown'
}

// How specific a scope is: this degree, its faculty and type, its faculty, national
const scopeRank = (r: {
  degreeId: number | null
  degreeType: string | null
  facultyId: number | null
}) => (r.degreeId ? 3 : r.degreeType ? 2 : r.facultyId ? 1 : 0)

// Display order: the national contest, then the faculty's own routes, the
// general audience before the narrower ones
const ROUTE_ORDER = ['cna', 'direct', 'special']
const AUDIENCE_ORDER = ['all', 'national', 'internal', 'international']

type GuideRow = typeof schema.admissionGuides.$inferSelect
type RoundRow = typeof schema.admissionRounds.$inferSelect
type ScopedRow = GuideRow | RoundRow

interface ApplyDegree {
  id: number
  type: DegreeType
  facultyId: number | null
}

/** Reviewed guides in the page's language and every round, matching `where` */
async function fetchRows(
  db: Db,
  lang: 'pt' | 'en',
  where: (
    t: typeof schema.admissionGuides | typeof schema.admissionRounds
  ) => SQL | undefined
): Promise<{ guides: GuideRow[]; rounds: RoundRow[] }> {
  const g = schema.admissionGuides
  const r = schema.admissionRounds
  const [guides, rounds] = await Promise.all([
    db
      .select()
      .from(g)
      .where(and(where(g), eq(g.lang, lang), isNotNull(g.reviewedAt))),
    db.select().from(r).where(where(r))
  ])
  return { guides, rounds }
}

/** The rows that speak for this degree: its own, its faculty's, national CNA */
function inScope(x: ScopedRow, degree: ApplyDegree, inCna: boolean): boolean {
  if (x.degreeId !== null) return x.degreeId === degree.id
  if (x.facultyId !== null) {
    return (
      x.facultyId === degree.facultyId &&
      (x.degreeType === null || x.degreeType === degree.type)
    )
  }
  return inCna && x.route === 'cna'
}

/**
 * How to apply (prds/content_rich_pages.md, "Ingresso v2"): per (route,
 * audience), the most specific reviewed guide, and the rounds of the latest
 * intake from a scope at least as specific as that guide. So a degree with its
 * own guide (an IST master's applied for at another faculty) doesn't inherit
 * its faculty's calendar, for any audience when that guide is for 'all'.
 * `facultySectionId` is left null: the caller sets it when the faculty's
 * Candidaturas page carries the route.
 */
function resolveApplyRoutes(
  rows: { guides: GuideRow[]; rounds: RoundRow[] },
  degree: ApplyDegree,
  lang: 'pt' | 'en',
  today: string,
  inCna: boolean
): AdmissionRouteView[] {
  const allGuides = rows.guides.filter((x) => inScope(x, degree, inCna))
  const allRounds = rows.rounds.filter((x) => inScope(x, degree, inCna))

  // A guide for every audience ('all') speaks for the whole route at its scope:
  // narrower audiences from less specific scopes (IST's international calendar,
  // for a master's applied for at another faculty) don't apply
  const allRank = new Map<string, number>()
  for (const x of allGuides) {
    if (x.audience === 'all') {
      allRank.set(x.route, Math.max(allRank.get(x.route) ?? 0, scopeRank(x)))
    }
  }
  const applies = (x: ScopedRow) =>
    x.audience === 'all' || scopeRank(x) >= (allRank.get(x.route) ?? 0)
  const guides = allGuides.filter(applies)
  const rounds = allRounds.filter(applies)

  const keys = new Set([
    ...guides.map((x) => `${x.route}|${x.audience}`),
    ...rounds.map((x) => `${x.route}|${x.audience}`)
  ])
  const views: AdmissionRouteView[] = []
  for (const key of keys) {
    const [route, audience] = key.split('|') as [
      AdmissionRouteView['route'],
      AdmissionRouteView['audience']
    ]
    const guide = guides
      .filter((x) => x.route === route && x.audience === audience)
      .sort((a, b) => scopeRank(b) - scopeRank(a))[0]
    const minRank = guide ? scopeRank(guide) : 0
    const candidates = rounds.filter(
      (x) =>
        x.route === route && x.audience === audience && scopeRank(x) >= minRank
    )
    const bestRank = Math.max(-1, ...candidates.map(scopeRank))
    const scoped = candidates.filter((x) => scopeRank(x) === bestRank)
    const schoolYear = scoped.length
      ? Math.max(...scoped.map((x) => x.schoolYear))
      : null
    const intake = scoped
      .filter((x) => x.schoolYear === schoolYear)
      .sort((a, b) => a.position - b.position)
    if (!guide && intake.length === 0) continue
    // The more specific of the guide and the rounds says whose route it is
    const scopeRow =
      guide && scopeRank(guide) >= bestRank ? guide : (intake[0] ?? guide)
    views.push({
      route,
      audience,
      guide: guide
        ? {
            scope: guide.degreeId
              ? ('degree' as const)
              : guide.facultyId
                ? ('faculty' as const)
                : ('national' as const),
            body: guide.body,
            summary: guide.summary,
            applicationFee:
              guide.applicationFeeEur !== null
                ? {
                    amountEur: Number(guide.applicationFeeEur),
                    note: guide.applicationFeeNote
                  }
                : null,
            applyUrl: guide.applyUrl,
            sourceUrls: guide.sourceUrls
          }
        : null,
      schoolYear,
      rounds: intake.map((x) => ({
        label: lang === 'en' ? x.labelEn : x.labelPt,
        opensOn: x.opensOn,
        closesOn: x.closesOn,
        resultsOn: x.resultsOn,
        status: roundStatus(x.opensOn, x.closesOn, today)
      })),
      roundsSourceUrl: intake[0]?.sourceUrl ?? null,
      scope: routeScope(scopeRow!),
      facultySectionId: null
    })
  }
  return views.sort(
    (a, b) =>
      ROUTE_ORDER.indexOf(a.route) - ROUTE_ORDER.indexOf(b.route) ||
      AUDIENCE_ORDER.indexOf(a.audience) - AUDIENCE_ORDER.indexOf(b.audience)
  )
}

function routeScope(x: ScopedRow): AdmissionRouteScope {
  return {
    level: x.degreeId ? 'degree' : x.facultyId ? 'faculty' : 'national',
    degreeType: x.degreeId ? null : x.degreeType
  }
}

/**
 * How to apply to one degree, for its page and Ingresso. A route shared with
 * other degrees gets the anchor of its section on the faculty's Candidaturas
 * page, which then carries the calendar and guide (no copy on every degree).
 */
export async function loadApplyRoutes(
  db: Db,
  degree: ApplyDegree,
  lang: 'pt' | 'en',
  today: string,
  inCna: boolean
): Promise<AdmissionRouteView[]> {
  const [rows, faculty] = await Promise.all([
    fetchRows(db, lang, (t) =>
      or(
        eq(t.degreeId, degree.id),
        degree.facultyId !== null
          ? and(
              eq(t.facultyId, degree.facultyId),
              isNull(t.degreeId),
              or(isNull(t.degreeType), eq(t.degreeType, degree.type))
            )
          : undefined,
        inCna
          ? and(isNull(t.facultyId), isNull(t.degreeId), eq(t.route, 'cna'))
          : undefined
      )
    ),
    degree.facultyId !== null
      ? loadFacultyApply(db, degree.facultyId, lang, today)
      : Promise.resolve(null)
  ])
  const sectionIds =
    faculty && hasAdmissionsPage(faculty)
      ? new Set(faculty.sections.map((s) => s.id))
      : new Set<string>()
  return resolveApplyRoutes(rows, degree, lang, today, inCna).map((view) => {
    const id = applySectionId(view.route, view.audience, view.scope)
    return {
      ...view,
      facultySectionId:
        view.scope.level !== 'degree' && sectionIds.has(id) ? id : null
    }
  })
}

/**
 * Every listed degree of a faculty with a page (slug) that students apply to
 * from outside, whether it is in the Concurso Nacional (a DGES pair with
 * results, as the degree page decides), in the order of the hub's table.
 * Minors (taken by the faculty's own students) and `other` programmes are
 * left out: a faculty-wide guide with no degree type (ULisboa's
 * international one) would otherwise list them as if applied to from abroad.
 */
async function loadListedDegrees(
  db: Db,
  facultyId: number,
  lang: 'pt' | 'en'
): Promise<(FacultyApplyDegree & { inCna: boolean })[]> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT d.id, d.type, d.name, d.name_en, d.acronym, d.slug,
      EXISTS (
        SELECT 1 FROM sources.degree_external_ids e
        JOIN sources.dges_admissions a
          ON e.external_id = a.unit_code || '/' || a.course_code
        WHERE e.degree_id = d.id AND e.source = 'dges'
      ) AS in_cna
    FROM degrees d
    JOIN degree_stats ds ON ds.degree_id = d.id AND ds.course_count > 0
    WHERE d.faculty_id = ${facultyId} AND d.slug IS NOT NULL
      AND d.type NOT IN ('minor', 'other')
    ORDER BY ds.feedback_count DESC, d.acronym
  `)
  return rows.map((r) => ({
    id: Number(r.id),
    type: r.type as DegreeType,
    name: pickName(lang, String(r.name), r.name_en as string | null).value,
    acronym: String(r.acronym),
    slug: String(r.slug),
    inCna: Boolean(r.in_cna)
  }))
}

/**
 * The faculty's Candidaturas page (`/:facultySlug/candidaturas`): every
 * listed degree's routes, resolved as on its own page, then grouped. A route
 * from shared rows (the faculty's, or the national CNA) becomes one section
 * listing the degrees it covers; a route of one degree alone stays that
 * degree's, and the page only points to its Ingresso.
 */
export async function loadFacultyApply(
  db: Db,
  facultyId: number,
  lang: 'pt' | 'en',
  today: string
): Promise<FacultyApplyData> {
  const degrees = await loadListedDegrees(db, facultyId, lang)
  const ids = degrees.map((d) => d.id)
  const rows = await fetchRows(db, lang, (t) =>
    or(
      and(eq(t.facultyId, facultyId), isNull(t.degreeId)),
      ids.length > 0 ? inArray(t.degreeId, ids) : undefined,
      degrees.some((d) => d.inCna)
        ? and(isNull(t.facultyId), isNull(t.degreeId), eq(t.route, 'cna'))
        : undefined
    )
  )

  const sections = new Map<string, FacultyApplySection>()
  const ownRoutes: FacultyApplyData['ownRoutes'] = []
  for (const { inCna, ...degree } of degrees) {
    const views = resolveApplyRoutes(
      rows,
      { id: degree.id, type: degree.type, facultyId },
      lang,
      today,
      inCna
    )
    for (const view of views) {
      if (view.scope.level === 'degree') {
        ownRoutes.push({ degree, view })
        continue
      }
      const id = applySectionId(view.route, view.audience, view.scope)
      const section = sections.get(id) ?? {
        id,
        route: view.route,
        audience: view.audience,
        degrees: [],
        types: [],
        view: { ...view, facultySectionId: id }
      }
      section.degrees.push(degree)
      if (!section.types.includes(degree.type)) section.types.push(degree.type)
      sections.set(id, section)
    }
  }

  const typeOrder = (s: FacultyApplySection) =>
    Math.min(...s.types.map((t) => DEGREE_TYPES.indexOf(t)))
  return {
    sections: [...sections.values()]
      .map((s) => ({
        ...s,
        types: [...s.types].sort(
          (a, b) => DEGREE_TYPES.indexOf(a) - DEGREE_TYPES.indexOf(b)
        )
      }))
      // By degree type (as in the hub's table), then route and audience
      .sort(
        (a, b) =>
          typeOrder(a) - typeOrder(b) ||
          ROUTE_ORDER.indexOf(a.route) - ROUTE_ORDER.indexOf(b.route) ||
          AUDIENCE_ORDER.indexOf(a.audience) -
            AUDIENCE_ORDER.indexOf(b.audience)
      ),
    ownRoutes,
    today
  }
}
