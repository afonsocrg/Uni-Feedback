import { database } from '@uni-feedback/db'
import { degreeStats, degrees, faculties } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq, or, sql } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

const FacultySearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  shortName: z.string(),
  slug: z.string().nullable(),
  reviewCount: z.number()
})

const SearchFacultiesResponseSchema = z.object({
  faculties: FacultySearchResultSchema.array(),
  total: z.number()
})

export class SearchFaculties extends OpenAPIRoute {
  schema = {
    tags: ['Faculties'],
    summary: 'Search faculties by name or short name',
    request: {
      query: z.object({
        q: z
          .string()
          .optional()
          .describe('Search query for faculty name or short name'),
        limit: z.coerce
          .number()
          .min(1)
          .max(20)
          .default(5)
          .describe('Max results')
      })
    },
    responses: {
      '200': {
        description: 'Faculty search results',
        content: {
          'application/json': {
            schema: SearchFacultiesResponseSchema
          }
        }
      }
    }
  }

  async handle(_c: Context) {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const { q, limit } = query

    const db = database()

    const whereClause = q
      ? or(
          sql`unaccent(${faculties.name}) ILIKE unaccent(${`%${q}%`})`,
          sql`unaccent(${faculties.shortName}) ILIKE unaccent(${`%${q}%`})`
        )
      : undefined

    const rows = await db
      .select({
        id: faculties.id,
        name: faculties.name,
        shortName: faculties.shortName,
        slug: faculties.slug,
        reviewCount: sql<number>`coalesce(sum(${degreeStats.feedbackCount}), 0)`
      })
      .from(faculties)
      .leftJoin(degrees, eq(degrees.facultyId, faculties.id))
      .leftJoin(degreeStats, eq(degreeStats.degreeId, degrees.id))
      .where(whereClause)
      .groupBy(
        faculties.id,
        faculties.name,
        faculties.shortName,
        faculties.slug
      )
      .orderBy(faculties.name)
      .limit(limit)

    const results = rows.map((r) => ({
      ...r,
      reviewCount: Number(r.reviewCount)
    }))
    return Response.json({ faculties: results, total: results.length })
  }
}
