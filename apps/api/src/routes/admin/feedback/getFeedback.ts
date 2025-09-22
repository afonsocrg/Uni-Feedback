import { database } from '@uni-feedback/db'
import { courses, degrees, faculties, feedback } from '@uni-feedback/db/schema'
import {
  PaginatedResponse,
  PaginationQuerySchema,
  getPaginatedSchema
} from '@types'
import { OpenAPIRoute } from 'chanfana'
import { and, count, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { withErrorHandling } from '../../utils'

const FeedbackQuerySchema = PaginationQuerySchema.extend({
  course_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  degree_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  faculty_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  email: z.string().optional(),
  approved: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    })
})

const AdminFeedbackSchema = z.object({
  id: z.number(),
  email: z.string().nullable(),
  schoolYear: z.number().nullable(),
  rating: z.number(),
  workloadRating: z.number().nullable(),
  comment: z.string().nullable(),
  approved: z.boolean(),
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
  courseId: z.number(),
  courseName: z.string(),
  courseAcronym: z.string(),
  degreeId: z.number(),
  degreeName: z.string(),
  degreeAcronym: z.string(),
  facultyId: z.number(),
  facultyName: z.string(),
  facultyShortName: z.string()
})

const PaginatedFeedbackResponseSchema = getPaginatedSchema(AdminFeedbackSchema)

export class GetFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Feedback'],
    summary: 'Get paginated feedback with filtering',
    description:
      'Retrieve feedback with pagination, search, and comprehensive filtering capabilities',
    request: {
      query: FeedbackQuerySchema
    },
    responses: {
      '200': {
        description: 'Feedback retrieved successfully',
        content: {
          'application/json': {
            schema: PaginatedFeedbackResponseSchema
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
    return withErrorHandling(request, async () => {
      const { query } = await this.getValidatedData<typeof this.schema>()
      const { page, limit, course_id, degree_id, faculty_id, email, approved } =
        query


      // Build where conditions
      const conditions = []

      if (course_id) {
        conditions.push(eq(feedback.courseId, course_id))
      }

      if (degree_id) {
        conditions.push(eq(courses.degreeId, degree_id))
      }

      if (faculty_id) {
        conditions.push(eq(degrees.facultyId, faculty_id))
      }

      if (email) {
        conditions.push(
          sql`LOWER(${feedback.email}) LIKE ${`%${email.toLowerCase()}%`}`
        )
      }

      if (approved !== undefined) {
        if (approved) {
          conditions.push(isNotNull(feedback.approvedAt))
        } else {
          conditions.push(isNull(feedback.approvedAt))
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const totalResult = await database()
        .select({ count: count() })
        .from(feedback)
        .leftJoin(courses, eq(feedback.courseId, courses.id))
        .leftJoin(degrees, eq(courses.degreeId, degrees.id))
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(whereClause)

      const total = totalResult[0].count
      const totalPages = Math.ceil(total / limit)
      const offset = (page - 1) * limit

      // Get feedback with course, degree, and faculty info
      const feedbackResult = await database()
        .select({
          id: feedback.id,
          email: feedback.email,
          schoolYear: feedback.schoolYear,
          rating: feedback.rating,
          workloadRating: feedback.workloadRating,
          comment: feedback.comment,
          approvedAt: feedback.approvedAt,
          createdAt: feedback.createdAt,
          courseId: courses.id,
          courseName: courses.name,
          courseAcronym: courses.acronym,
          degreeId: degrees.id,
          degreeName: degrees.name,
          degreeAcronym: degrees.acronym,
          facultyId: faculties.id,
          facultyName: faculties.name,
          facultyShortName: faculties.shortName
        })
        .from(feedback)
        .leftJoin(courses, eq(feedback.courseId, courses.id))
        .leftJoin(degrees, eq(courses.degreeId, degrees.id))
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(whereClause)
        .orderBy(desc(feedback.createdAt))
        .limit(limit)
        .offset(offset)

      const response: PaginatedResponse<any> = {
        data: feedbackResult.map((fb) => ({
          ...fb,
          approved: fb.approvedAt !== null,
          approvedAt: fb.approvedAt?.toISOString() || null,
          createdAt: fb.createdAt?.toISOString() || ''
        })),
        total,
        page,
        limit,
        totalPages
      }

      return Response.json(response)
    })
  }
}
