import { courses, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

export class RemoveCourseTerm extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Courses'],
    summary: 'Remove term from course',
    description: "Removes a term from the course's list of terms",
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10)),
        term: z.string()
      })
    },
    responses: {
      '200': {
        description: 'Term removed successfully',
        content: {
          'application/json': {
            schema: z.object({
              courseId: z.number(),
              terms: z.array(z.string()),
              message: z.string()
            })
          }
        }
      },
      '400': {
        description: 'Term not found in course',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
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
      const { id, term } = params

      const db = getDb(env)

      // Get current course and terms
      const course = await db
        .select({
          id: courses.id,
          terms: courses.terms
        })
        .from(courses)
        .where(eq(courses.id, id))
        .limit(1)

      if (course.length === 0) {
        return Response.json({ error: 'Course not found' }, { status: 404 })
      }

      const currentTerms = (course[0].terms as string[]) || []

      // Check if term exists
      if (!currentTerms.includes(term)) {
        return Response.json(
          { error: 'Term not found in course' },
          { status: 400 }
        )
      }

      // Remove term
      const updatedTerms = currentTerms.filter((t) => t !== term)

      // Update course
      await db
        .update(courses)
        .set({
          terms: updatedTerms,
          updatedAt: new Date()
        })
        .where(eq(courses.id, id))

      return Response.json({
        courseId: id,
        terms: updatedTerms,
        message: 'Term removed successfully'
      })
    } catch (error) {
      console.error('Remove course term error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
