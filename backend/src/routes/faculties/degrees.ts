import { getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { DegreeService } from '@services'

const DegreeResponseSchema = z.object({
  id: z.number(),
  externalId: z.string(),
  type: z.string(),
  name: z.string(),
  acronym: z.string(),
  courseCount: z.number(),
  feedbackCount: z.number()
})

export class GetFacultyDegrees extends OpenAPIRoute {
  schema = {
    tags: ['Faculties'],
    summary: 'Get all degrees for a specific faculty',
    description:
      'Returns a list of all degrees belonging to the specified faculty with their course and feedback counts',
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
        description:
          'List of degrees for the faculty with course and feedback counts',
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

    const degreeService = new DegreeService(db)
    const result = await degreeService.getDegreesWithCounts({
      facultyId,
      onlyWithCourses
    })

    return Response.json(result)
  }
}
