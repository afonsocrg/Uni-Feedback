import { PaginationQuerySchema, getPaginatedSchema } from '@types'
import { database, offeringsSubquery } from '@uni-feedback/db'
import { courses, degrees, faculties } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, count, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { CourseOfferingSchema } from '../../courses/offeringSchema'

const CoursesQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  degree_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  faculty_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  term: z.string().optional()
})

const AdminCourseSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  ects: z.number().nullable(),
  degreeId: z.number(),
  degreeName: z.string(),
  degreeAcronym: z.string(),
  facultyId: z.number(),
  facultyName: z.string(),
  facultyShortName: z.string(),
  totalFeedbackCount: z.number(),
  offerings: z.array(CourseOfferingSchema),
  createdAt: z.string()
})

const PaginatedCoursesResponseSchema = getPaginatedSchema(AdminCourseSchema)

export class GetCourses extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Courses'],
    summary: 'Get paginated courses with filtering',
    description:
      'Retrieve courses with pagination, search, degree, faculty and term filtering capabilities',
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

  async handle() {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const { page, limit, search, degree_id, faculty_id, term } = query

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

    if (faculty_id) {
      conditions.push(eq(degrees.facultyId, faculty_id))
    }

    if (term) {
      // Filter courses that have an offering in the named academic term
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM course_offerings o
          JOIN academic_terms t ON t.id = o.academic_term_id
          WHERE o.course_id = ${courses.id} AND t.name = ${term}
        )`
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const totalResult = await database()
      .select({ count: count() })
      .from(courses)
      .leftJoin(degrees, eq(courses.degreeId, degrees.id))
      .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
      .where(whereClause)

    const total = totalResult[0].count
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    // Get courses with degree and faculty info plus feedback count
    const coursesResult = await database()
      .select({
        id: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        ects: courses.ects,
        degreeId: courses.degreeId,
        degreeName: degrees.name,
        degreeAcronym: degrees.acronym,
        facultyId: faculties.id,
        facultyName: faculties.name,
        facultyShortName: faculties.shortName,
        offerings: offeringsSubquery(),
        createdAt: courses.createdAt,
        totalFeedbackCount: sql<number>`(
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

    const response = {
      data: coursesResult.map((course) => ({
        ...course,
        totalFeedbackCount: Number(course.totalFeedbackCount),
        createdAt: course.createdAt?.toISOString() || ''
      })),
      total,
      page,
      limit,
      totalPages
    }

    return Response.json(response)
  }
}
