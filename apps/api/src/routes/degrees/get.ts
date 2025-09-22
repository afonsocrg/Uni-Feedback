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

export class GetDegrees extends OpenAPIRoute {
  schema = {
    tags: ['Degrees'],
    summary: 'Get all degrees with course and feedback counts',
    description:
      'Returns a list of all degrees with their course count and feedback count, optionally filtered by faculty',
    request: {
      query: z.object({
        faculty: z.string().optional(),
        onlyWithCourses: z.boolean().optional()
      })
    },
    responses: {
      '200': {
        description: 'List of degrees with course and feedback counts',
        content: {
          'application/json': {
            schema: DegreeResponseSchema.array()
          }
        }
      }
    }
  }

  async handle(request: IRequest, env: Env, context: any) {
    const { onlyWithCourses = true, faculty } = request.query

    const degreeService = new DegreeService(env)
    const result = await degreeService.getDegreesWithCounts({
      facultyShortName: faculty,
      onlyWithCourses
    })

    return Response.json(result)
  }
}
