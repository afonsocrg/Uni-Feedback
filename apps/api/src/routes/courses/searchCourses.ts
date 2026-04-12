import { getAuthContext } from '@middleware'
import { BadRequestError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import { courses, degrees, faculties, feedback } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, or, sql } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

const CourseSearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  degree: z.object({
    id: z.number(),
    name: z.string(),
    acronym: z.string()
  }),
  faculty: z.object({
    id: z.number(),
    name: z.string(),
    shortName: z.string()
  }),
  hasUserFeedback: z.boolean()
})

const SearchResponseSchema = z.object({
  courses: CourseSearchResultSchema.array(),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
})

export class SearchCourses extends OpenAPIRoute {
  schema = {
    tags: ['Courses'],
    summary: 'Search courses with filters and pagination',
    description:
      'Search courses by name/acronym with optional faculty/degree filters. Returns paginated results without feedback aggregation for fast queries.',
    request: {
      query: z.object({
        q: z
          .string()
          .optional()
          .describe('Search query for course name or acronym'),
        faculty_id: z.coerce
          .number()
          .optional()
          .describe('Filter by faculty ID'),
        degree_id: z.coerce.number().optional().describe('Filter by degree ID'),
        limit: z.coerce
          .number()
          .min(1)
          .max(50)
          .default(20)
          .describe('Results per page'),
        offset: z.coerce
          .number()
          .min(0)
          .max(1000)
          .default(0)
          .describe('Pagination offset')
      })
    },
    responses: {
      '200': {
        description: 'Paginated course search results',
        content: {
          'application/json': {
            schema: SearchResponseSchema
          }
        }
      },
      '400': {
        description: 'Invalid request - missing search parameters'
      }
    }
  }

  async handle(c: Context) {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const { q, faculty_id, degree_id, limit, offset } = query

    // Validate at least one search parameter is provided
    if (!q && !faculty_id && !degree_id) {
      throw new BadRequestError(
        'At least one search parameter (q, faculty_id, or degree_id) is required'
      )
    }

    const authContext = await getAuthContext(c)
    const userId = authContext?.user?.id ?? null

    const conditions = []

    // Case-insensitive and accent-insensitive search using unaccent extension
    if (q) {
      const searchCondition = or(
        sql`unaccent(${courses.name}) ILIKE unaccent(${`%${q}%`})`,
        sql`unaccent(${courses.acronym}) ILIKE unaccent(${`%${q}%`})`
      )
      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    if (degree_id) {
      conditions.push(eq(courses.degreeId, degree_id))
    }

    if (faculty_id) {
      conditions.push(eq(degrees.facultyId, faculty_id))
    }

    const db = database()
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    let results: Array<{
      id: number
      name: string
      acronym: string
      degree: { id: number; name: string; acronym: string }
      faculty: { id: number; name: string; shortName: string }
      hasUserFeedback: boolean
    }>

    if (userId) {
      const rows = await db
        .select({
          id: courses.id,
          name: courses.name,
          acronym: courses.acronym,
          degree: {
            id: degrees.id,
            name: degrees.name,
            acronym: degrees.acronym
          },
          faculty: {
            id: faculties.id,
            name: faculties.name,
            shortName: faculties.shortName
          },
          hasUserFeedback: sql<boolean>`(${feedback.id} IS NOT NULL)`
        })
        .from(courses)
        .innerJoin(degrees, eq(courses.degreeId, degrees.id))
        .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
        .leftJoin(
          feedback,
          and(eq(feedback.courseId, courses.id), eq(feedback.userId, userId))
        )
        .where(whereClause)
        .orderBy(
          sql`CASE WHEN ${feedback.id} IS NOT NULL THEN 1 ELSE 0 END`,
          courses.name
        )
        .limit(limit)
        .offset(offset)

      results = rows.map((r) => ({
        ...r,
        hasUserFeedback: Boolean(r.hasUserFeedback)
      }))
    } else {
      const rows = await db
        .select({
          id: courses.id,
          name: courses.name,
          acronym: courses.acronym,
          degree: {
            id: degrees.id,
            name: degrees.name,
            acronym: degrees.acronym
          },
          faculty: {
            id: faculties.id,
            name: faculties.name,
            shortName: faculties.shortName
          }
        })
        .from(courses)
        .innerJoin(degrees, eq(courses.degreeId, degrees.id))
        .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(whereClause)
        .orderBy(courses.name)
        .limit(limit)
        .offset(offset)

      results = rows.map((r) => ({ ...r, hasUserFeedback: false }))
    }

    // Get total count for pagination (independent of user auth)
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .innerJoin(degrees, eq(courses.degreeId, degrees.id))
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .where(whereClause)

    return Response.json({
      courses: results,
      total: Number(count),
      limit,
      offset
    })
  }
}
