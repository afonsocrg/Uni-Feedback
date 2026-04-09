import { requireAdmin } from '@middleware'
import { database } from '@uni-feedback/db'
import { courseGroup } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { NotFoundError } from '../../utils'

export class DeleteCourseGroup extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Course Groups'],
    summary: 'Delete a course group',
    description: 'Delete a course group and remove it from the system',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      })
    },
    responses: {
      '204': {
        description: 'Course group deleted successfully'
      },
      '404': {
        description: 'Course group not found',
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
    await requireAdmin(request, env, context)
    const { params } = await this.getValidatedData<typeof this.schema>()
    const { id } = params

    // Check if course group exists
    const existingCourseGroup = await database()
      .select()
      .from(courseGroup)
      .where(eq(courseGroup.id, id))
      .limit(1)

    if (existingCourseGroup.length === 0) {
      throw new NotFoundError('Course group not found')
    }

    // Delete course group
    await database().delete(courseGroup).where(eq(courseGroup.id, id))

    return new Response(null, { status: 204 })
  }
}
