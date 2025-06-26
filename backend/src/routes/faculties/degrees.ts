import { courses, degrees, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const DegreeResponseSchema = z.object({
  id: z.number(),
  externalId: z.string(),
  type: z.string(),
  name: z.string(),
  acronym: z.string()
})

export class GetFacultyDegrees extends OpenAPIRoute {
  schema = {
    tags: ['Faculties'],
    summary: 'Get all degrees for a specific faculty',
    description:
      'Returns a list of all degrees belonging to the specified faculty with their aggregated feedback data',
    request: {
      params: z.object({
        facultyId: z.string().transform((val) => parseInt(val, 10))
      }),
      query: z.object({
        onlyWithCourses: z.boolean().optional().default(true)
      })
    },
    responses: {
      '200': {
        description: 'List of degrees for the faculty with aggregated feedback data',
        content: {
          'application/json': {
            schema: DegreeResponseSchema.array()
          }
        }
      },
      '404': {
        description: 'Faculty not found'
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    const db = getDb(env)
    const { facultyId } = request.params
    const { onlyWithCourses = true } = request.query

    const baseQuery = db
      .select({
        id: degrees.id,
        externalId: degrees.externalId,
        type: degrees.type,
        name: degrees.name,
        acronym: degrees.acronym
      })
      .from(degrees)
      .where(eq(degrees.facultyId, facultyId))

    const result = onlyWithCourses
      ? await baseQuery
          .innerJoin(courses, eq(courses.degreeId, degrees.id))
          .groupBy(degrees.id)
      : await baseQuery

    return Response.json(result)
  }
}