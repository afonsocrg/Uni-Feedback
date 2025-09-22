import { database } from '@uni-feedback/db'
import { degrees, faculties } from '@uni-feedback/db/schema'
import { PaginatedResponse } from '@types'
import { OpenAPIRoute } from 'chanfana'
import { and, count, eq, or, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const DegreesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '1', 10)),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '20', 10)),
  search: z.string().optional(),
  faculty_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  type: z.string().optional()
})

const AdminDegreeSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  type: z.string(),
  facultyId: z.number(),
  facultyName: z.string(),
  facultyShortName: z.string(),
  courseCount: z.number(),
  createdAt: z.string()
})

const PaginatedDegreesResponseSchema = z.object({
  data: z.array(AdminDegreeSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export class GetDegrees extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Degrees'],
    summary: 'Get paginated degrees with filtering',
    description:
      'Retrieve degrees with pagination, search, and filtering capabilities for admin dashboard',
    request: {
      query: DegreesQuerySchema
    },
    responses: {
      '200': {
        description: 'Degrees retrieved successfully',
        content: {
          'application/json': {
            schema: PaginatedDegreesResponseSchema
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
      const { page, limit, search, faculty_id, type } = query


      // Build where conditions
      const conditions = []

      if (search) {
        conditions.push(
          or(
            sql`LOWER(${degrees.name}) LIKE ${`%${search.toLowerCase()}%`}`,
            sql`LOWER(${degrees.acronym}) LIKE ${`%${search.toLowerCase()}%`}`
          )
        )
      }

      if (faculty_id) {
        conditions.push(eq(degrees.facultyId, faculty_id))
      }

      if (type) {
        conditions.push(eq(degrees.type, type))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await database()
        .select({ count: count() })
        .from(degrees)
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(whereClause)

      const total = totalResult[0].count
      const totalPages = Math.ceil(total / limit)
      const offset = (page - 1) * limit

      // Get degrees with course count
      const degreesResult = await database()
        .select({
          id: degrees.id,
          name: degrees.name,
          acronym: degrees.acronym,
          type: degrees.type,
          facultyId: degrees.facultyId,
          facultyName: faculties.name,
          facultyShortName: faculties.shortName,
          createdAt: degrees.createdAt,
          courseCount: sql<number>`(
            SELECT COUNT(*) 
            FROM courses 
            WHERE courses.degree_id = ${degrees.id}
          )`
        })
        .from(degrees)
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(whereClause)
        .orderBy(degrees.name)
        .limit(limit)
        .offset(offset)

      const response: PaginatedResponse<any> = {
        data: degreesResult.map((degree) => ({
          ...degree,
          courseCount: Number(degree.courseCount),
          createdAt: degree.createdAt?.toISOString() || ''
        })),
        total,
        page,
        limit,
        totalPages
      }

      return Response.json(response)
    } catch (error) {
      console.error('Get degrees error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
