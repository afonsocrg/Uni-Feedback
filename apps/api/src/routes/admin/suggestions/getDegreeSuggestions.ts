import { degrees, faculties, getDb } from '@uni-feedback/database'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, or, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const DegreeSuggestionsQuerySchema = z.object({
  faculty_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
})

const DegreeSuggestionSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string()
})

const DegreeSuggestionsResponseSchema = z.array(DegreeSuggestionSchema)

export class GetDegreeSuggestions extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Suggestions'],
    summary: 'Get degree suggestions for filtering',
    description:
      'Retrieve lightweight degree suggestions (id, name, acronym) with optional faculty filtering',
    request: {
      query: DegreeSuggestionsQuerySchema
    },
    responses: {
      '200': {
        description: 'Degree suggestions retrieved successfully',
        content: {
          'application/json': {
            schema: DegreeSuggestionsResponseSchema
          }
        }
      },
      '400': {
        description: 'Invalid query parameters',
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
      const { query } = await this.getValidatedData<typeof this.schema>()
      const { faculty_id } = query

      const db = getDb(env)

      // Build where conditions
      const conditions = []

      if (faculty_id) {
        conditions.push(eq(degrees.facultyId, faculty_id))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get degrees with just id, name, and acronym
      const degreesResult = await db
        .select({
          id: degrees.id,
          name: degrees.name,
          acronym: degrees.acronym
        })
        .from(degrees)
        .where(whereClause)
        .orderBy(degrees.name)

      return Response.json(degreesResult)
    } catch (error) {
      console.error('Get degree suggestions error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
