import { courses, degrees, faculties, getDb } from '@db'
import { PaginatedResponse, PaginationQuerySchema, getPaginatedSchema } from '@types'
import { OpenAPIRoute } from 'chanfana'
import { and, count, eq, or, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const CoursesQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  degree_id: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined)
})

const AdminCourseSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  ects: z.number().nullable(),
  degreeId: z.number(),
  degreeName: z.string(),
  degreeAcronym: z.string(),
  facultyName: z.string(),
  feedbackCount: z.number(),
  terms: z.array(z.string()).nullable(),
  createdAt: z.string()
})

const PaginatedCoursesResponseSchema = getPaginatedSchema(AdminCourseSchema)

export class GetCourses extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Courses'],
    summary: 'Get paginated courses with filtering',
    description: 'Retrieve courses with pagination, search, and degree filtering capabilities',
    request: {
      query: CoursesQuerySchema
    },
    responses: {
      '200': {
        description: 'Courses retrieved successfully',
        content: {
          'application/json': {
            schema: PaginatedCoursesResponseSchema
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
          or(
            sql`LOWER(${courses.name}) LIKE ${`%${search.toLowerCase()}%`}`,
            sql`LOWER(${courses.acronym}) LIKE ${`%${search.toLowerCase()}%`}`
          )
        )
      }

      if (degree_id) {
        conditions.push(eq(courses.degreeId, degree_id))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(courses)
        .leftJoin(degrees, eq(courses.degreeId, degrees.id))
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(whereClause)

      const total = totalResult[0].count
      const totalPages = Math.ceil(total / limit)
      const offset = (page - 1) * limit

      // Get courses with degree and faculty info plus feedback count
      const coursesResult = await db
        .select({
          id: courses.id,
          name: courses.name,
          acronym: courses.acronym,
          ects: courses.ects,
          degreeId: courses.degreeId,
          degreeName: degrees.name,
          degreeAcronym: degrees.acronym,
          facultyName: faculties.name,
          terms: courses.terms,
          createdAt: courses.createdAt,
          feedbackCount: sql<number>`(
            SELECT COUNT(*) 
            FROM feedback 
            WHERE feedback.course_id = ${courses.id}
          )`
        })
        .from(courses)
        .leftJoin(degrees, eq(courses.degreeId, degrees.id))
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(whereClause)
        .orderBy(courses.name)
        .limit(limit)
        .offset(offset)

      const response: PaginatedResponse<any> = {
        data: coursesResult.map(course => ({
          ...course,
          feedbackCount: Number(course.feedbackCount),
          terms: course.terms as string[] | null,
          createdAt: course.createdAt?.toISOString() || ''
        })),
        total,
        page,
        limit,
        totalPages
      }

      return Response.json(response)
    } catch (error) {
      console.error('Get courses error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}