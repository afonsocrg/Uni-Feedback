import { faculties, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const FacultyResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  shortName: z.string(),
  url: z.string(),
  emailSuffixes: z.array(z.string()).optional()
})

export class GetFaculties extends OpenAPIRoute {
  schema = {
    tags: ['Faculties'],
    summary: 'Get all faculties',
    description:
      'Returns a list of all faculties, optionally filtered by acronym',
    request: {
      query: z.object({
        acronym: z.string().optional()
      })
    },
    responses: {
      '200': {
        description: 'List of faculties',
        content: {
          'application/json': {
            schema: FacultyResponseSchema.array()
          }
        }
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    const db = getDb(env)
    const { acronym } = request.query

    let query = db
      .select({
        id: faculties.id,
        name: faculties.name,
        shortName: faculties.shortName,
        url: faculties.url,
        emailSuffixes: faculties.emailSuffixes
      })
      .from(faculties)

    // Filter by acronym if provided
    if (acronym) {
      query = query.where(eq(faculties.shortName, acronym))
    }

    const result = await query

    return Response.json(result)
  }
}
