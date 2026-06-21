import { requireAuth } from '@middleware'
import { database } from '@uni-feedback/db'
import {
  academicTerms,
  courseOfferings,
  courses,
  feedback
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, desc, eq, isNotNull, notInArray, sql } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

/**
 * Recommends courses the user should review next, ordered along the curriculum
 * timeline relative to where they currently are.
 *
 * Algorithm:
 *  1. Pick the degree the user has reviewed the most (ties broken by most recent
 *     feedback).
 *  2. Anchor on the LATEST course they reviewed in that degree.
 *  3. Place every offering on a timeline at `pos = curriculum_year * 100 +
 *     end_tick` (100 > the max tick), and take the anchor's position as the MIN
 *     `pos` across its offerings (its earliest offering). This collapses
 *     "curriculum year + term" into one integer so "before/after" is a single
 *     comparison: a course is "before" the anchor if it has an offering in an
 *     earlier year, or the same year with an `end_tick` at or before the
 *     anchor's.
 *  4. Rank the unreviewed courses in that degree:
 *       - "already taken" first — courses with an offering at or before the
 *         anchor, closest first (largest `pos <= anchor`);
 *       - then "upcoming" — courses only offered after the anchor, closest
 *         first (smallest `pos > anchor`);
 *       - then courses with no curriculum year on any offering (can't be placed
 *         on the timeline), alphabetically, last.
 *     If the anchor course itself has no year on any offering, every candidate
 *     falls into that last bucket (alphabetical).
 *  5. Return the top 3.
 */
export class GetFeedbackRecommendations extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Get personalized course recommendations for feedback',
    description:
      "Returns up to 3 courses the user should write feedback for, based on their most-reviewed degree and courses they haven't reviewed yet",
    responses: {
      '200': {
        description: 'Recommendations retrieved successfully',
        content: {
          'application/json': {
            schema: z.object({
              recommendations: z.array(
                z.object({
                  id: z.number(),
                  acronym: z.string(),
                  name: z.string()
                })
              )
            })
          }
        }
      },
      '401': {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      }
    }
  }

  async handle(c: Context) {
    // Authenticate user
    const authContext = await requireAuth(c)
    const userId = authContext.user.id
    const db = database()

    // 1. The user's feedback, newest first.
    const userFeedback = await db
      .select({
        courseId: feedback.courseId,
        degreeId: courses.degreeId
      })
      .from(feedback)
      .innerJoin(courses, eq(feedback.courseId, courses.id))
      .where(eq(feedback.userId, userId))
      .orderBy(desc(feedback.createdAt))

    // Edge case: User has no feedback yet
    if (userFeedback.length === 0) {
      return Response.json({ recommendations: [] })
    }

    const reviewedCourseIds = new Set(userFeedback.map((fb) => fb.courseId))

    // The degree the user has reviewed the most (ties broken by most recent
    // feedback, since userFeedback is ordered newest-first).
    const degreeCount = new Map<number, number>()
    for (const fb of userFeedback) {
      if (fb.degreeId) {
        degreeCount.set(fb.degreeId, (degreeCount.get(fb.degreeId) || 0) + 1)
      }
    }
    let anchorDegreeId: number | null = null
    let topCount = 0
    for (const [degreeId, count] of degreeCount) {
      if (count > topCount) {
        anchorDegreeId = degreeId
        topCount = count
      }
    }
    if (!anchorDegreeId) {
      return Response.json({ recommendations: [] })
    }

    // Anchor: the latest course the user reviewed in that degree (userFeedback
    // is newest-first, so the first match is the latest).
    const anchor = userFeedback.find((fb) => fb.degreeId === anchorDegreeId)!

    // 2. Anchor position on the timeline. A course's offering sits at
    //    pos = curriculum_year * 100 + end_tick (100 > the max tick of 8), so
    //    "before" reduces to a single integer comparison. We use the anchor's
    //    EARLIEST offering (min pos); NULL if it has no offering with a year.
    const posSql = sql`${courseOfferings.curriculumYear} * 100 + ${academicTerms.endTick}`

    const [anchorRow] = await db
      .select({ pos: sql<number | null>`MIN(${posSql})` })
      .from(courseOfferings)
      .innerJoin(
        academicTerms,
        eq(academicTerms.id, courseOfferings.academicTermId)
      )
      .where(
        and(
          eq(courseOfferings.courseId, anchor.courseId),
          isNotNull(courseOfferings.curriculumYear)
        )
      )
    const anchorPos = anchorRow?.pos ?? null

    // 3. Candidate courses in the anchor's degree the user hasn't reviewed yet.
    //    Per course, find the closest offering at or before the anchor (pastPos)
    //    and the closest one after it (futurePos).
    const candidates = await db
      .select({
        id: courses.id,
        acronym: courses.acronym,
        name: courses.name,
        pastPos: sql<
          number | null
        >`MAX(CASE WHEN ${courseOfferings.curriculumYear} IS NOT NULL AND (${posSql}) <= ${anchorPos} THEN (${posSql}) END)`,
        futurePos: sql<
          number | null
        >`MIN(CASE WHEN ${courseOfferings.curriculumYear} IS NOT NULL AND (${posSql}) > ${anchorPos} THEN (${posSql}) END)`
      })
      .from(courses)
      .leftJoin(courseOfferings, eq(courseOfferings.courseId, courses.id))
      .leftJoin(
        academicTerms,
        eq(academicTerms.id, courseOfferings.academicTermId)
      )
      .where(
        and(
          eq(courses.degreeId, anchorDegreeId),
          notInArray(courses.id, Array.from(reviewedCourseIds))
        )
      )
      .groupBy(courses.id)

    // 4. Rank: already-taken (past/concurrent, closest first), then upcoming
    //    (closest first), then unknown-position courses last. When the anchor
    //    has no timeline position, every course falls into the unknown bucket.
    const ranked = candidates
      .map((course) => {
        const past = course.pastPos === null ? null : Number(course.pastPos)
        const future =
          course.futurePos === null ? null : Number(course.futurePos)
        if (past !== null) return { course, bucket: 0, sortKey: -past }
        if (future !== null) return { course, bucket: 1, sortKey: future }
        return { course, bucket: 2, sortKey: 0 }
      })
      .sort(
        (a, b) =>
          a.bucket - b.bucket ||
          a.sortKey - b.sortKey ||
          a.course.acronym.localeCompare(b.course.acronym)
      )

    // 5. Return top 3 recommendations
    const recommendations = ranked.slice(0, 3).map(({ course }) => ({
      id: course.id,
      acronym: course.acronym,
      name: course.name
    }))

    return Response.json({ recommendations })
  }
}
