import { courses, degrees, faculties, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq, and } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const DegreeResponseSchema = z.object({
  id: z.number(),
  externalId: z.string(),
  type: z.string(),
  name: z.string(),
  acronym: z.string()
})

export class GetDegrees extends OpenAPIRoute {
  schema = {
    tags: ['Degrees'],
    summary: 'Get all degrees with aggregated feedback data',
    description:
      'Returns a list of all degrees with their average rating and feedback count, optionally filtered by faculty',
    request: {
      query: z.object({
        faculty: z.string().optional(),
        onlyWithCourses: z.boolean().optional()
      })
    },
    responses: {
      '200': {
        description: 'List of degrees with aggregated feedback data',
        content: {
          'application/json': {
            schema: DegreeResponseSchema.array()
          }
        }
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    const db = getDb(env)
    const { onlyWithCourses = true, faculty } = request.query

    let baseQuery = db
      .select({
        id: degrees.id,
        externalId: degrees.externalId,
        type: degrees.type,
        name: degrees.name,
        acronym: degrees.acronym
      })
      .from(degrees)

    // Filter by faculty if provided
    if (faculty) {
      baseQuery = baseQuery
        .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(eq(faculties.shortName, faculty))
    }

    const result = onlyWithCourses
      ? await baseQuery
          .innerJoin(courses, eq(courses.degreeId, degrees.id))
          .groupBy(degrees.id)
      : await baseQuery

    return Response.json(result)
  }
}
