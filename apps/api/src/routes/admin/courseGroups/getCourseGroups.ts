import { courseGroup, getDb } from '@uni-feedback/database'
import {
  PaginatedResponse,
  PaginationQuerySchema,
  getPaginatedSchema
} from '@types'
import { OpenAPIRoute } from 'chanfana'
import { and, count, eq, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const CourseGroupsQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  degree_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
})

const AdminCourseGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  degreeId: z.number(),
  createdAt: z.string()
})

const PaginatedCourseGroupsResponseSchema = getPaginatedSchema(
  AdminCourseGroupSchema
)

export class GetCourseGroups extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Course Groups'],
    summary: 'Get paginated course groups with filtering',
    description:
      'Retrieve course groups with pagination, search, and degree filtering capabilities',
    request: {
      query: CourseGroupsQuerySchema
    },
    responses: {
      '200': {
        description: 'Course groups retrieved successfully',
        content: {
          'application/json': {
            schema: PaginatedCourseGroupsResponseSchema
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
      const { page, limit, search, degree_id } = query

      const db = getDb(env)

      // Build where conditions
      const conditions = []

      if (search) {
        conditions.push(
          sql`LOWER(${courseGroup.name}) LIKE ${`%${search.toLowerCase()}%`}`
        )
      }

      if (degree_id) {
        conditions.push(eq(courseGroup.degreeId, degree_id))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(courseGroup)
        .where(whereClause)

      const total = totalResult[0].count
      const totalPages = Math.ceil(total / limit)
      const offset = (page - 1) * limit

      // Get course groups
      const courseGroupsResult = await db
        .select({
          id: courseGroup.id,
          name: courseGroup.name,
          degreeId: courseGroup.degreeId,
          createdAt: courseGroup.createdAt
        })
        .from(courseGroup)
        .where(whereClause)
        .orderBy(courseGroup.name)
        .limit(limit)
        .offset(offset)

      const response: PaginatedResponse<any> = {
        data: courseGroupsResult.map((group) => ({
          ...group,
          createdAt: group.createdAt?.toISOString() || ''
        })),
        total,
        page,
        limit,
        totalPages
      }

      return Response.json(response)
    } catch (error) {
      console.error('Get course groups error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
