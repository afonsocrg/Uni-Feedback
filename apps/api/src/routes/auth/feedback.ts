import { authenticateUser } from '@middleware'
import { database } from '@uni-feedback/db'
import {
  courses,
  feedback,
  feedbackAnalysis,
  pointRegistry
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, desc, eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

export class GetUserFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Get current user feedback',
    responses: {
      '200': {
        description: 'User feedback retrieved successfully',
        content: {
          'application/json': {
            schema: z.object({
              feedback: z.array(
                z.object({
                  id: z.number(),
                  courseId: z.number(),
                  courseName: z.string(),
                  courseCode: z.string(),
                  schoolYear: z.number().nullable(),
                  rating: z.number(),
                  workloadRating: z.number().nullable(),
                  comment: z.string().nullable(),
                  points: z.number().nullable(),
                  approvedAt: z.date().nullable(),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                  analysis: z
                    .object({
                      hasTeaching: z.boolean(),
                      hasAssessment: z.boolean(),
                      hasMaterials: z.boolean(),
                      hasTips: z.boolean(),
                      wordCount: z.number()
                    })
                    .nullable()
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

  async handle(request: IRequest, env: any, context: any) {
    try {
      // Authenticate user
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck

      const userId = context.user.id

      // Get all feedback by this user with course details
      const userFeedback = await database()
        .select({
          id: feedback.id,
          courseId: feedback.courseId,
          courseName: courses.name,
          courseCode: courses.acronym,
          schoolYear: feedback.schoolYear,
          rating: feedback.rating,
          workloadRating: feedback.workloadRating,
          comment: feedback.comment,
          approvedAt: feedback.approvedAt,
          createdAt: feedback.createdAt,
          updatedAt: feedback.updatedAt,
          // Analysis fields
          hasTeaching: feedbackAnalysis.hasTeaching,
          hasAssessment: feedbackAnalysis.hasAssessment,
          hasMaterials: feedbackAnalysis.hasMaterials,
          hasTips: feedbackAnalysis.hasTips,
          wordCount: feedbackAnalysis.wordCount,
          // Points
          points: pointRegistry.amount
        })
        .from(feedback)
        .innerJoin(courses, eq(feedback.courseId, courses.id))
        .leftJoin(
          feedbackAnalysis,
          eq(feedback.id, feedbackAnalysis.feedbackId)
        )
        .leftJoin(
          pointRegistry,
          and(
            eq(pointRegistry.referenceId, feedback.id),
            eq(pointRegistry.sourceType, 'submit_feedback'),
            eq(pointRegistry.userId, userId)
          )
        )
        .where(eq(feedback.userId, userId))
        .orderBy(desc(feedback.createdAt))

      // Transform the results to match the schema
      const transformedFeedback = userFeedback.map((item) => ({
        ...item,
        analysis:
          item.wordCount !== null
            ? {
                hasTeaching: item.hasTeaching,
                hasAssessment: item.hasAssessment!,
                hasMaterials: item.hasMaterials!,
                hasTips: item.hasTips!,
                wordCount: item.wordCount!
              }
            : null
      }))

      return Response.json({
        feedback: transformedFeedback
      })
    } catch (error) {
      console.error('Get user feedback error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
