import { database, schema } from '@uni-feedback/db'
import type { DegreeType } from '@uni-feedback/db/schema'
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm'
import type {
  AdmissionRoundStatus,
  AdmissionRouteView
} from '~/components/degree/pageTypes'

/**
 * How to apply to a degree (prds/content_rich_pages.md, "Ingresso v2"), read
 * by the degree page's Ingresso section and the `/ingresso` sub-page: the
 * routes in, each with our reviewed guide and the rounds of its latest intake
 * (`admission_guides`, `admission_rounds`, migration 0062).
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

/**
 * How to apply (prds/content_rich_pages.md, "Ingresso v2"): per (route,
 * audience), the most specific reviewed guide, and the rounds of the latest
 * intake from a scope at least as specific as that guide. So a degree with its
 * own guide (an IST master's applied for at another faculty) doesn't inherit
 * its faculty's calendar, for any audience when that guide is for 'all'.
 */
export async function loadApplyRoutes(
  db: Db,
  degree: { id: number; type: DegreeType; facultyId: number | null },
  lang: 'pt' | 'en',
  today: string,
  inCna: boolean
): Promise<AdmissionRouteView[]> {
  const g = schema.admissionGuides
  const r = schema.admissionRounds
  const scope = (t: typeof g | typeof r) =>
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

  const [allGuides, allRounds] = await Promise.all([
    db
      .select()
      .from(g)
      .where(and(scope(g), eq(g.lang, lang), isNotNull(g.reviewedAt))),
    db.select().from(r).where(scope(r))
  ])

  // A guide for every audience ('all') speaks for the whole route at its scope:
  // narrower audiences from less specific scopes (IST's international calendar,
  // for a master's applied for at another faculty) don't apply
  const allRank = new Map<string, number>()
  for (const x of allGuides) {
    if (x.audience === 'all') {
      allRank.set(x.route, Math.max(allRank.get(x.route) ?? 0, scopeRank(x)))
    }
  }
  const applies = (
    x: (typeof allGuides)[number] | (typeof allRounds)[number]
  ) => x.audience === 'all' || scopeRank(x) >= (allRank.get(x.route) ?? 0)
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
      roundsSourceUrl: intake[0]?.sourceUrl ?? null
    })
  }
  return views.sort(
    (a, b) =>
      ROUTE_ORDER.indexOf(a.route) - ROUTE_ORDER.indexOf(b.route) ||
      AUDIENCE_ORDER.indexOf(a.audience) - AUDIENCE_ORDER.indexOf(b.audience)
  )
}
