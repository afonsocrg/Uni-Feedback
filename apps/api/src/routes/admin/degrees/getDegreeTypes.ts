import { database } from '@uni-feedback/db'
import { DEGREE_TYPES, degrees } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
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
      'Without faculty_id: every valid degree type, in display order (for editing). With faculty_id: the types that faculty uses (for filtering)',
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

  async handle() {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const { faculty_id } = query

    if (!faculty_id) {
      return Response.json({ types: DEGREE_TYPES })
    }

    // Ordered by the enum, which is the display order
    const typesResult = await database()
      .selectDistinct({ type: degrees.type })
      .from(degrees)
      .where(eq(degrees.facultyId, faculty_id))
      .orderBy(degrees.type)

    const types = typesResult.map((row) => row.type)

    return Response.json({ types })
  }
}
