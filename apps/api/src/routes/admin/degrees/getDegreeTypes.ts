import { database } from '@uni-feedback/db'
import { degrees } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const DegreeTypesQuerySchema = z.object({
  faculty_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
})

const DegreeTypesResponseSchema = z.object({
  types: z.array(z.string())
})

export class GetDegreeTypes extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Degrees'],
    summary: 'Get all degree types',
    description:
      'Retrieve all distinct degree types available in the system for filtering, optionally filtered by faculty',
    request: {
      query: DegreeTypesQuerySchema
    },
    responses: {
      '200': {
        description: 'Degree types retrieved successfully',
        content: {
          'application/json': {
            schema: DegreeTypesResponseSchema
          }
        }
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    try {
      const { query } = await this.getValidatedData<typeof this.schema>()
      const { faculty_id } = query

      // Build where conditions
      const conditions = [
        sql`${degrees.type} IS NOT NULL AND ${degrees.type} != ''`
      ]

      if (faculty_id) {
        conditions.push(eq(degrees.facultyId, faculty_id))
      }

      const whereClause =
        conditions.length > 1 ? and(...conditions) : conditions[0]

      // Get distinct degree types
      const typesResult = await database()
        .selectDistinct({
          type: degrees.type
        })
        .from(degrees)
        .where(whereClause)
        .orderBy(degrees.type)

      const types = typesResult
        .map((row) => row.type)
        .filter((type) => type !== null && type !== '')

      return Response.json({ types })
    } catch (error) {
      console.error('Get degree types error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
