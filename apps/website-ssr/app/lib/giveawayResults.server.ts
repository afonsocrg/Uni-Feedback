import { database } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import { GIVEAWAY_END, GIVEAWAY_START } from '@uni-feedback/utils'
import { and, desc, eq, gte, isNotNull, lt, sql } from 'drizzle-orm'

/**
 * Public giveaway results: what the campaign produced, aggregated.
 *
 * Read fresh on every page load, deliberately. The page is a live snapshot
 * during the campaign and a recap after it, and the whole point of publishing
 * it is that a student can submit a review and watch their degree's total go
 * up. A cache would make the page lie for as long as its TTL, which is exactly
 * the moment someone is looking at it after submitting.
 *
 * The queries are small aggregates over the in-window slice of `feedback`
 * (~1.3k rows), joined to courses/degrees/faculties. If this ever gets heavy,
 * the fix is an index on `feedback (created_at)`, not a cache.
 *
 * PRIVACY. The rules below are not styling choices, they are the reason this
 * page is safe to publish:
 *   - Nothing here publishes contributor counts, per degree OR per faculty.
 *     Review counts say nothing about how many people wrote them; contributor
 *     counts do, and next to a review count they can pin a number of reviews on
 *     one identifiable person.
 *   - Degrees with fewer than MIN_CONTRIBUTORS contributors are dropped
 *     entirely. This is load-bearing and not made redundant by the top-N cut:
 *     at the time of writing, the highest excluded degree sits two reviews
 *     outside the list with a single contributor behind all of them.
 * Never publish a per-student breakdown on this page.
 */

/** Below this, a group's reviews are traceable to individuals. See above. */
const MIN_CONTRIBUTORS = 3

/**
 * How many degrees are sent to the page. The component shows five and hides the
 * rest behind the expand button, so this is the depth of the expanded list, not
 * of the first screen.
 *
 * This IS a truncation: 36 degrees currently clear MIN_CONTRIBUTORS, so ten is
 * a top-ten, not the whole field. That is why the expand button says "top 10"
 * rather than "all 10" — the label must not promise a complete list it is not
 * showing. Raise the number and the label follows automatically.
 */
const DEGREE_LIMIT = 10

export interface ResultsDegree {
  degreeId: number
  name: string
  acronym: string
  slug: string | null
  facultyShortName: string
  facultySlug: string | null
  /** Square logo path on the CDN, or null for faculties without one. */
  facultyLogo: string | null
  reviews: number
}

export interface ResultsFaculty {
  facultyId: number
  shortName: string
  slug: string | null
  reviews: number
}

export interface GiveawayResults {
  /** Campaign window, ISO strings so the loader payload stays serializable. */
  windowStart: string
  windowEnd: string
  /** When these numbers were read. Rendered as the "updated at" line. */
  generatedAt: string
  totals: {
    reviews: number
    contributors: number
    courses: number
    degrees: number
    faculties: number
    words: number
  }
  degrees: ResultsDegree[]
  faculties: ResultsFaculty[]
}

/**
 * Only approved reviews count. Approval is the same gate the rest of the site
 * uses to decide whether a review is public, so counting rejected ones here
 * would publish a total that no page can account for.
 */
const inWindow = and(
  isNotNull(schema.feedback.approvedAt),
  gte(schema.feedback.createdAt, GIVEAWAY_START),
  lt(schema.feedback.createdAt, GIVEAWAY_END)
)

/** Words across every comment in the slice. Empty comments contribute nothing. */
const wordCount = sql<number>`coalesce(sum(
  array_length(regexp_split_to_array(btrim(${schema.feedback.comment}), '\\s+'), 1)
) filter (where btrim(coalesce(${schema.feedback.comment}, '')) <> ''), 0)`

const contributorCount = sql<number>`count(distinct ${schema.feedback.userId})`
const reviewCount = sql<number>`count(*)`

export async function getGiveawayResults(): Promise<GiveawayResults> {
  const db = database()

  const [totalsRows, degreeRows, facultyRows] = await Promise.all([
    db
      .select({
        reviews: reviewCount,
        contributors: contributorCount,
        courses: sql<number>`count(distinct ${schema.feedback.courseId})`,
        degrees: sql<number>`count(distinct ${schema.courses.degreeId})`,
        faculties: sql<number>`count(distinct ${schema.degrees.facultyId})`,
        words: wordCount
      })
      .from(schema.feedback)
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.feedback.courseId)
      )
      .innerJoin(schema.degrees, eq(schema.degrees.id, schema.courses.degreeId))
      .where(inWindow),

    db
      .select({
        degreeId: schema.degrees.id,
        name: schema.degrees.name,
        acronym: schema.degrees.acronym,
        slug: schema.degrees.slug,
        facultyShortName: schema.faculties.shortName,
        facultySlug: schema.faculties.slug,
        facultyLogo: schema.faculties.logo,
        reviews: reviewCount
      })
      .from(schema.feedback)
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.feedback.courseId)
      )
      .innerJoin(schema.degrees, eq(schema.degrees.id, schema.courses.degreeId))
      .innerJoin(
        schema.faculties,
        eq(schema.faculties.id, schema.degrees.facultyId)
      )
      .where(inWindow)
      .groupBy(
        schema.degrees.id,
        schema.degrees.name,
        schema.degrees.acronym,
        schema.degrees.slug,
        schema.faculties.shortName,
        schema.faculties.slug,
        schema.faculties.logo
      )
      .having(sql`${contributorCount} >= ${MIN_CONTRIBUTORS}`)
      .orderBy(desc(reviewCount), schema.degrees.acronym)
      .limit(DEGREE_LIMIT),

    db
      .select({
        facultyId: schema.faculties.id,
        shortName: schema.faculties.shortName,
        slug: schema.faculties.slug,
        reviews: reviewCount
      })
      .from(schema.feedback)
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.feedback.courseId)
      )
      .innerJoin(schema.degrees, eq(schema.degrees.id, schema.courses.degreeId))
      .innerJoin(
        schema.faculties,
        eq(schema.faculties.id, schema.degrees.facultyId)
      )
      .where(inWindow)
      .groupBy(
        schema.faculties.id,
        schema.faculties.shortName,
        schema.faculties.slug
      )
      .orderBy(desc(reviewCount), schema.faculties.shortName)
  ])

  // Postgres returns bigints as strings over the wire, so every aggregate goes
  // through Number() before it reaches the component.
  const totals = totalsRows[0]

  return {
    windowStart: GIVEAWAY_START.toISOString(),
    windowEnd: GIVEAWAY_END.toISOString(),
    generatedAt: new Date().toISOString(),
    totals: {
      reviews: Number(totals?.reviews ?? 0),
      contributors: Number(totals?.contributors ?? 0),
      courses: Number(totals?.courses ?? 0),
      degrees: Number(totals?.degrees ?? 0),
      faculties: Number(totals?.faculties ?? 0),
      words: Number(totals?.words ?? 0)
    },
    degrees: degreeRows.map((degree) => ({
      ...degree,
      reviews: Number(degree.reviews)
    })),
    faculties: facultyRows.map((faculty) => ({
      ...faculty,
      reviews: Number(faculty.reviews)
    }))
  }
}
