import { courses, degrees, feedback, getDb } from '@db'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { sendCourseReviewReceived } from '@services/telegram'
import { contentJson, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z, ZodError } from 'zod'

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
    try {
      const db = getDb(env)
      const courseId = parseInt(request.params.id)
      const { body } = await this.getValidatedData<typeof this.schema>()

      // Validate school year
      const currentSchoolYear = getCurrentSchoolYear()
      if (body.schoolYear > currentSchoolYear) {
        return Response.json(
          {
            error: 'Cannot submit feedback for a future school year'
          },
          { status: 400 }
        )
      }

      // Check if course exists
      const courseResult = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1)

      if (courseResult.length === 0) {
        return Response.json(
          {
            error: 'Course not found'
          },
          { status: 404 }
        )
      }
      const course = courseResult[0]

      const degreeResult = await db
        .select()
        .from(degrees)
        .where(eq(degrees.id, courseResult[0].degreeId))
        .limit(1)

      if (degreeResult.length === 0) {
        return Response.json(
          {
            error: 'Degree not found'
          },
          { status: 404 }
        )
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
        approvedAt: new Date('1970-01-01')
      }

      await db.insert(feedback).values(feedbackData)

      await sendCourseReviewReceived(env, {
        email: body.email,
        schoolYear: body.schoolYear,
        degree,
        rating: body.rating,
        workloadRating: body.workloadRating,
        course,
        comment
      })

      return Response.json(
        {
          message: 'Feedback submitted successfully'
        },
        { status: 201 }
      )
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return Response.json({ error }, { status: 400 })
      }

      console.error('Error submitting feedback:', error)
      return Response.json(
        {
          error: 'Failed to submit feedback'
        },
        { status: 500 }
      )
    }
  }
}
