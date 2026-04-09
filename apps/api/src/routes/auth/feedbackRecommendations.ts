import { requireAuth } from '@middleware'
import { database } from '@uni-feedback/db'
import { courses, feedback } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, desc, eq, notInArray, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

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

  async handle(request: IRequest, env: Env, context: RequestContext) {
    // Authenticate user
    const authContext = await requireAuth(request, env, context)
    const userId = authContext.user.id
    const db = database()

    // 1. Get all feedback by this user with course degree information
    const userFeedback = await db
      .select({
        courseId: feedback.courseId,
        degreeId: courses.degreeId,
        curriculumYear: courses.curriculumYear,
        createdAt: feedback.createdAt
      })
      .from(feedback)
      .innerJoin(courses, eq(feedback.courseId, courses.id))
      .where(eq(feedback.userId, userId))

    // Edge case: User has no feedback yet
    if (userFeedback.length === 0) {
      return Response.json({
        recommendations: []
      })
    }

    // 2. Count feedback per degree and find the most-reviewed degree
    const degreeCountMap = new Map<number, number>()
    const degreeLastFeedbackMap = new Map<number, Date>()
    const reviewedCourseIds = new Set<number>()

    for (const fb of userFeedback) {
      if (fb.degreeId) {
        degreeCountMap.set(
          fb.degreeId,
          (degreeCountMap.get(fb.degreeId) || 0) + 1
        )

        // Track most recent feedback for tie-breaking
        const currentLastFeedback = degreeLastFeedbackMap.get(fb.degreeId)
        if (
          !currentLastFeedback ||
          (fb.createdAt && fb.createdAt > currentLastFeedback)
        ) {
          degreeLastFeedbackMap.set(fb.degreeId, fb.createdAt!)
        }
      }
      reviewedCourseIds.add(fb.courseId)
    }

    // Find degree with most feedback (break ties with most recent feedback)
    let mostReviewedDegreeId: number | null = null
    let maxCount = 0
    let maxCountLastFeedback: Date | null = null

    for (const [degreeId, count] of degreeCountMap.entries()) {
      const lastFeedback = degreeLastFeedbackMap.get(degreeId)
      if (
        count > maxCount ||
        (count === maxCount &&
          lastFeedback &&
          maxCountLastFeedback &&
          lastFeedback > maxCountLastFeedback)
      ) {
        mostReviewedDegreeId = degreeId
        maxCount = count
        maxCountLastFeedback = lastFeedback || null
      }
    }

    // Edge case: No valid degree found (shouldn't happen if data is consistent)
    if (!mostReviewedDegreeId) {
      return Response.json({
        recommendations: []
      })
    }

    // 3. Find the max curriculum year the user has reviewed in that degree
    const maxReviewedCurriculumYear = Math.max(
      ...userFeedback
        .filter(
          (fb) =>
            fb.degreeId === mostReviewedDegreeId && fb.curriculumYear !== null
        )
        .map((fb) => fb.curriculumYear!)
    )

    // 4. Query courses in that degree that the user hasn't reviewed yet
    const whereConditions = [
      eq(courses.degreeId, mostReviewedDegreeId),
      notInArray(courses.id, Array.from(reviewedCourseIds))
    ]

    // Only filter by curriculum year if we found a valid max year
    if (maxReviewedCurriculumYear > 0) {
      whereConditions.push(
        sql`${courses.curriculumYear} <= ${maxReviewedCurriculumYear}`
      )
    }

    const unreviewedCourses = await db
      .select({
        id: courses.id,
        acronym: courses.acronym,
        name: courses.name,
        curriculumYear: courses.curriculumYear
      })
      .from(courses)
      .where(and(...whereConditions))
      .orderBy(
        desc(courses.curriculumYear), // Most recent curriculum year first
        courses.acronym // Alphabetical as tie-breaker
      )

    // Edge case: User has reviewed all courses in their degree
    if (unreviewedCourses.length === 0) {
      return Response.json({
        recommendations: []
      })
    }

    // 5. Return top 3 recommendations
    const recommendations = unreviewedCourses.slice(0, 3).map((course) => ({
      id: course.id,
      acronym: course.acronym,
      name: course.name
    }))

    return Response.json({
      recommendations
    })
  }
}
