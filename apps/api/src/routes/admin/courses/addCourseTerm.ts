import { requireAdmin } from '@middleware'
import { database } from '@uni-feedback/db'
import { courses } from '@uni-feedback/db/schema'
import { notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { withErrorHandling } from '../../utils'

const AddTermSchema = z.object({
  term: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9\s\-/]+$/, 'Invalid term format')
})

export class AddCourseTerm extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Courses'],
    summary: 'Add term to course',
    description: "Adds a new term to the course's list of terms",
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      }),
      body: {
        content: {
          'application/json': {
            schema: AddTermSchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Term added successfully',
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
        description: 'Invalid request data or term already exists',
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

  async handle(request: IRequest, env: Env, context: RequestContext) {
    return withErrorHandling(request, async () => {
      const authContext = await requireAdmin(request, env, context)
      const { params, body } = await this.getValidatedData<typeof this.schema>()
      const { id } = params
      const { term } = body

      // Get current course and terms
      const course = await database()
        .select({
          id: courses.id,
          name: courses.name,
          acronym: courses.acronym,
          terms: courses.terms
        })
        .from(courses)
        .where(eq(courses.id, id))
        .limit(1)

      if (course.length === 0) {
        return Response.json({ error: 'Course not found' }, { status: 404 })
      }

      const currentTerms = (course[0].terms as string[]) || []

      // Check if term already exists
      if (currentTerms.includes(term)) {
        return Response.json({ error: 'Term already exists' }, { status: 400 })
      }

      // Add new term
      const updatedTerms = [...currentTerms, term].sort()

      // Update course
      await database()
        .update(courses)
        .set({
          terms: updatedTerms,
          updatedAt: new Date()
        })
        .where(eq(courses.id, id))

      // Send notification
      await notifyAdminChange({
        env,
        user: authContext.user,
        resourceType: 'course',
        resourceId: id,
        resourceName: course[0].name,
        resourceShortName: course[0].acronym,
        action: 'added',
        addedItem: `term "${term}"`
      })

      return Response.json({
        courseId: id,
        terms: updatedTerms,
        message: 'Term added successfully'
      })
    })
  }
}
