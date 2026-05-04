import { database } from '@uni-feedback/db'
import { degreeStats, degrees, faculties } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq, or, sql } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

const DegreeSearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  slug: z.string().nullable(),
  faculty: z.object({
    id: z.number(),
    name: z.string(),
    shortName: z.string(),
    slug: z.string().nullable()
  }),
  reviewCount: z.number()
})

const SearchDegreesResponseSchema = z.object({
  degrees: DegreeSearchResultSchema.array(),
  total: z.number()
})

export class SearchDegrees extends OpenAPIRoute {
  schema = {
    tags: ['Degrees'],
    summary: 'Search degrees by name or acronym',
    request: {
      query: z.object({
        q: z
          .string()
          .optional()
          .describe('Search query for degree name or acronym'),
        limit: z.coerce
          .number()
          .min(1)
          .max(20)
          .default(10)
          .describe('Max results')
      })
    },
    responses: {
      '200': {
        description: 'Degree search results',
        content: {
          'application/json': {
            schema: SearchDegreesResponseSchema
          }
        }
      }
    }
  }

  async handle(c: Context) {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const { q, limit } = query

    const db = database()

    const whereClause = q
      ? or(
          sql`unaccent(${degrees.name}) ILIKE unaccent(${`%${q}%`})`,
          sql`unaccent(${degrees.acronym}) ILIKE unaccent(${`%${q}%`})`
        )
      : undefined

    const rows = await db
      .select({
        id: degrees.id,
        name: degrees.name,
        acronym: degrees.acronym,
        slug: degrees.slug,
        faculty: {
          id: faculties.id,
          name: faculties.name,
          shortName: faculties.shortName,
          slug: faculties.slug
        },
        reviewCount: degreeStats.feedbackCount
      })
      .from(degrees)
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .leftJoin(degreeStats, eq(degreeStats.degreeId, degrees.id))
      .where(whereClause)
      .orderBy(degrees.name)
      .limit(limit)

    const results = rows.map((r) => ({
      ...r,
      reviewCount: r.reviewCount ?? 0
    }))

    return Response.json({ degrees: results, total: results.length })
  }
}
