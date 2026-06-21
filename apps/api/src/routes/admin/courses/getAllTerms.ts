import { database } from '@uni-feedback/db'
import { academicTerms } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

const AllTermsQuerySchema = z.object({
  faculty_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
})

const AllTermsResponseSchema = z.object({
  terms: z.array(z.string())
})

export class GetAllTerms extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Courses'],
    summary: 'Get all academic term names',
    description:
      'Retrieve the distinct academic term names (the per-faculty catalog), with optional faculty filtering. Used to populate the course term filter.',
    request: {
      query: AllTermsQuerySchema
    },
    responses: {
      '200': {
        description: 'Terms retrieved successfully',
        content: {
          'application/json': {
            schema: AllTermsResponseSchema
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

  async handle() {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const { faculty_id } = query

    // Distinct academic term names from the catalog, optionally scoped to a
    // faculty. Names can repeat across faculties (e.g. "S1"), so de-dupe.
    const rows = await database()
      .selectDistinct({ name: academicTerms.name })
      .from(academicTerms)
      .where(faculty_id ? eq(academicTerms.facultyId, faculty_id) : undefined)
      .orderBy(asc(academicTerms.name))

    const sortedTerms = Array.from(new Set(rows.map((r) => r.name))).sort()

    return Response.json({
      terms: sortedTerms
    })
  }
}
