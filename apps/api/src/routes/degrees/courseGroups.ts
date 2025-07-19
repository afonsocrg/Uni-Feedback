import { courseGroup, degrees, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const CourseGroupResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  courseIds: z.array(z.number())
})

export class GetDegreeCourseGroups extends OpenAPIRoute {
  schema = {
    tags: ['Degrees'],
    summary: 'Get all course groups of the given degree',
    description: 'Returns a list of all course groups',
    request: {
      params: z.object({
        id: z.number()
      })
    },
    responses: {
      '200': {
        description: 'List of degrees with aggregated feedback data',
        content: {
          'application/json': {
            schema: CourseGroupResponseSchema.array()
          }
        }
      },
      '404': {
        description: 'Degree not found'
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    const db = getDb(env)

    const data = await this.getValidatedData<typeof this.schema>()

    const { id: degreeId } = data.params

    // Assert degree exists
    const degree = await db
      .select()
      .from(degrees)
      .where(eq(degrees.id, degreeId))
      .limit(1)
      .then(([degree]) => degree)

    if (!degree) {
      return Response.json({ error: 'Degree not found' }, { status: 404 })
    }

    const result = await db
      .select({
        id: courseGroup.id,
        name: courseGroup.name,
        courseIds: sql<string>`(
          SELECT group_concat(course_id)
          FROM mtm_course_groups__courses
          WHERE course_group_id = course_groups.id
        )`.as('course_ids')
      })
      .from(courseGroup)
      .where(eq(courseGroup.degreeId, degreeId))

    // Convert the comma-separated string of IDs to an array of numbers
    const formattedResult = result.map((group) => ({
      ...group,
      courseIds: group.courseIds ? group.courseIds.split(',').map(Number) : []
    }))

    return Response.json(formattedResult)
  }
}
