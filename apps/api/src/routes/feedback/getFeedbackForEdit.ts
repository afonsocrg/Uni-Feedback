import { authenticateUser } from '@middleware'
import { database } from '@uni-feedback/db'
import { courses, degrees, faculties, feedback } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { UnauthorizedError, withErrorHandling } from '../utils'

export class GetFeedbackForEdit extends OpenAPIRoute {
  schema = {
    tags: ['Feedback'],
    summary: 'Get feedback for editing',
    description:
      'Fetch feedback details with ownership verification for editing',
    request: {
      params: z.object({
        id: z.coerce.number().int().positive().max(2147483647)
      })
    },
    responses: {
      '200': { description: 'Feedback data retrieved successfully' },
      '401': { description: 'Not authenticated' },
      '403': { description: 'Not authorized to edit this feedback' },
      '404': { description: 'Feedback not found' }
    }
  }

  async handle(request: IRequest, env: Env, context: any) {
    return withErrorHandling(request, async () => {
      const feedbackId = parseInt(request.params.id)

      // Authenticate
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck
      const userId = context.user.id

      const db = database()

      // Query feedback with course, degree, and faculty info
      const [result] = await db
        .select({
          id: feedback.id,
          userId: feedback.userId,
          rating: feedback.rating,
          workloadRating: feedback.workloadRating,
          comment: feedback.comment,
          schoolYear: feedback.schoolYear,
          approvedAt: feedback.approvedAt,
          courseName: courses.name,
          courseCode: courses.acronym,
          courseId: courses.id,
          facultyShortName: faculties.shortName
        })
        .from(feedback)
        .innerJoin(courses, eq(feedback.courseId, courses.id))
        .innerJoin(degrees, eq(courses.degreeId, degrees.id))
        .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(and(eq(feedback.id, feedbackId), eq(feedback.userId, userId)))
        .limit(1)

      // Check ownership - if not found, either doesn't exist or not owned by user
      if (!result) {
        throw new UnauthorizedError('You can only edit your own feedback')
      }

      return Response.json({
        feedback: result
      })
    })
  }
}
