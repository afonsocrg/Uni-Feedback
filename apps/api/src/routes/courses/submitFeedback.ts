import { sendCourseReviewReceived } from '@services/telegram'
import { database } from '@uni-feedback/db'
import { courses, degrees, feedback } from '@uni-feedback/db/schema'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { contentJson, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { BusinessLogicError, NotFoundError, withErrorHandling } from '../utils'

const FeedbackRequestSchema = z
  .object({
    email: z.string().email(),
    schoolYear: z.number().int(),
    rating: z.number().int().min(1).max(5),
    workloadRating: z.number().int().min(1).max(5),
    comment: z.string().optional()
  })
  .strict()

export class SubmitFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Feedback', 'Courses'],
    summary: 'Submit feedback about a course',
    description: 'Submit feedback about a course',
    request: {
      params: z.object({
        id: z.number()
      }),
      body: contentJson(FeedbackRequestSchema)
    },
    responses: {
      '201': {
        description: 'Feedback submitted successfully'
      },
      '400': {
        description: 'Invalid input data'
      },
      '404': {
        description: 'Course not found'
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    return withErrorHandling(request, async () => {
      const courseId = parseInt(request.params.id)
      const { body } = await this.getValidatedData<typeof this.schema>()

      // Validate school year
      const currentSchoolYear = getCurrentSchoolYear()
      if (body.schoolYear > currentSchoolYear) {
        throw new BusinessLogicError(
          'Cannot submit feedback for a future school year'
        )
      }

      // Check if course exists
      const courseResult = await database()
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1)

      if (courseResult.length === 0) {
        throw new NotFoundError('Course not found')
      }
      const course = courseResult[0]

      if (!course.degreeId) {
        throw new NotFoundError('Course has no associated degree')
      }

      const degreeResult = await database()
        .select()
        .from(degrees)
        .where(eq(degrees.id, course.degreeId))
        .limit(1)

      if (degreeResult.length === 0) {
        throw new NotFoundError('Degree not found')
      }
      const degree = degreeResult[0]

      // Ignore empty comments
      const comment = body.comment?.trim() || null

      // Insert feedback
      const feedbackData = {
        email: body.email,
        schoolYear: body.schoolYear,
        courseId: courseId,
        rating: body.rating,
        workloadRating: body.workloadRating,
        comment: comment,
        originalComment: comment,
        approvedAt: new Date('1999-12-16T04:30:00.000Z') // Auto-approved marker (birthday easter egg!) Dec 16, 1999 04:30 UTC
      }

      const insertResult = await database()
        .insert(feedback)
        .values(feedbackData)
        .returning()

      if (!insertResult || insertResult.length === 0 || !insertResult[0].id) {
        throw new Error('Failed to insert feedback into database')
      }

      const feedbackId = insertResult[0].id

      await sendCourseReviewReceived(env, {
        id: feedbackId,
        email: body.email,
        schoolYear: body.schoolYear,
        degree,
        rating: body.rating,
        workloadRating: body.workloadRating,
        course: {
          ...course,
          terms: course.terms as string[] | null
        },
        comment
      })

      return Response.json(
        {
          message: 'Feedback submitted successfully'
        },
        { status: 201 }
      )
    })
  }
}
