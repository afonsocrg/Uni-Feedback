import { feedback, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const FeedbackSchema = z.object({
  id: z.number(),
  courseId: z.number(),
  rating: z.number(),
  workloadRating: z.number(),
  comment: z.string().nullable(),
  schoolYear: z.number(),
  createdAt: z.string()
})

export class GetCourseFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Courses'],
    summary: 'Get all feedback for a course',
    description: 'Returns all feedback entries for a specific course',
    request: {
      params: z.object({
        id: z.number()
      })
    },
    responses: {
      '200': {
        description: 'List of feedback entries for the course',
        content: {
          'application/json': {
            schema: FeedbackSchema.array()
          }
        }
      },
      '404': {
        description: 'Course not found'
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    const db = getDb(env)
    const courseId = parseInt(request.params.id)

    const result = await db
      .select({
        id: feedback.id,
        courseId: feedback.courseId,
        rating: feedback.rating,
        workloadRating: feedback.workloadRating,
        comment: feedback.comment,
        schoolYear: feedback.schoolYear,
        createdAt: feedback.createdAt
      })
      .from(feedback)
      .where(
        and(
          eq(feedback.courseId, courseId),
          isNotNull(feedback.approvedAt)
          // isNotNull(feedback.comment)
        )
      )
      .orderBy(desc(feedback.createdAt))

    return Response.json(result)
  }
}
