import { database } from '@uni-feedback/db'
import { courses } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const CourseTermsResponseSchema = z.object({
  courseId: z.number(),
  terms: z.array(z.string())
})

export class GetCourseTerms extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Courses'],
    summary: 'Get course terms',
    description: 'Retrieve the list of terms for a specific course',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      })
    },
    responses: {
      '200': {
        description: 'Course terms retrieved successfully',
        content: {
          'application/json': {
            schema: CourseTermsResponseSchema
          }
        }
      },
      '404': {
        description: 'Course not found',
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
      const { params } = await this.getValidatedData<typeof this.schema>()
      const { id } = params

      // Get course terms
      const courseResult = await database()
        .select({
          id: courses.id,
          terms: courses.terms
        })
        .from(courses)
        .where(eq(courses.id, id))
        .limit(1)

      if (courseResult.length === 0) {
        return Response.json({ error: 'Course not found' }, { status: 404 })
      }

      const course = courseResult[0]
      const terms = (course.terms as string[]) || []

      return Response.json({
        courseId: id,
        terms
      })
    } catch (error) {
      console.error('Get course terms error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
