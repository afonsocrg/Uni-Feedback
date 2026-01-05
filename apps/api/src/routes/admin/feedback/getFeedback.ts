import {
  PaginatedResponse,
  PaginationQuerySchema,
  getPaginatedSchema
} from '@types'
import { database } from '@uni-feedback/db'
import {
  courses,
  degrees,
  faculties,
  feedback,
  feedbackAnalysis,
  pointRegistry
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, count, desc, eq, gt, isNotNull, isNull, sql } from 'drizzle-orm'
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
    }),
  rating: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  workload_rating: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  has_comment: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    }),
  school_year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  created_after: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  reviewed: z.boolean().optional()
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
  facultyShortName: z.string(),
  analysis: z
    .object({
      hasTeaching: z.boolean(),
      hasAssessment: z.boolean(),
      hasMaterials: z.boolean(),
      hasTips: z.boolean(),
      wordCount: z.number()
    })
    .nullable(),
  points: z.number().nullable()
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
      const {
        page,
        limit,
        course_id,
        degree_id,
        faculty_id,
        email,
        approved,
        rating,
        workload_rating,
        has_comment,
        school_year,
        created_after,
        reviewed
      } = query

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

      if (rating !== undefined) {
        conditions.push(eq(feedback.rating, rating))
      }

      if (workload_rating !== undefined) {
        conditions.push(eq(feedback.workloadRating, workload_rating))
      }

      if (has_comment !== undefined) {
        if (has_comment) {
          conditions.push(
            sql`${feedback.comment} IS NOT NULL AND ${feedback.comment} != ''`
          )
        } else {
          conditions.push(
            sql`${feedback.comment} IS NULL OR ${feedback.comment} = ''`
          )
        }
      }

      if (school_year !== undefined) {
        conditions.push(eq(feedback.schoolYear, school_year))
      }

      if (created_after !== undefined) {
        // conditions.push(sql`${feedback.createdAt} >= ${created_after}`)
        conditions.push(gt(feedback.createdAt, created_after))
      }

      if (reviewed !== undefined) {
        if (reviewed) {
          conditions.push(isNotNull(feedbackAnalysis.reviewedAt))
        } else {
          conditions.push(isNull(feedbackAnalysis.reviewedAt))
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
        .leftJoin(
          feedbackAnalysis,
          eq(feedback.id, feedbackAnalysis.feedbackId)
        )
        .leftJoin(
          pointRegistry,
          and(
            eq(pointRegistry.referenceId, feedback.id),
            eq(pointRegistry.sourceType, 'submit_feedback')
          )
        )
        .where(whereClause)

      const total = totalResult[0].count
      const totalPages = Math.ceil(total / limit)
      const offset = (page - 1) * limit

      // Get feedback with course, degree, faculty, analysis, and points info
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
          facultyShortName: faculties.shortName,
          analysisHasTeaching: feedbackAnalysis.hasTeaching,
          analysisHasAssessment: feedbackAnalysis.hasAssessment,
          analysisHasMaterials: feedbackAnalysis.hasMaterials,
          analysisHasTips: feedbackAnalysis.hasTips,
          analysisWordCount: feedbackAnalysis.wordCount,
          analysisCreatedAt: feedbackAnalysis.createdAt,
          analysisReviewedAt: feedbackAnalysis.reviewedAt,
          analysisUpdatedAt: feedbackAnalysis.updatedAt,
          pointsAmount: pointRegistry.amount
        })
        .from(feedback)
        .leftJoin(courses, eq(feedback.courseId, courses.id))
        .leftJoin(degrees, eq(courses.degreeId, degrees.id))
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .leftJoin(
          feedbackAnalysis,
          eq(feedback.id, feedbackAnalysis.feedbackId)
        )
        .leftJoin(
          pointRegistry,
          and(
            eq(pointRegistry.referenceId, feedback.id),
            eq(pointRegistry.sourceType, 'submit_feedback')
          )
        )
        .where(whereClause)
        .orderBy(desc(feedback.createdAt))
        .limit(limit)
        .offset(offset)

      const response: PaginatedResponse<any> = {
        data: feedbackResult.map((fb) => ({
          id: fb.id,
          email: fb.email,
          schoolYear: fb.schoolYear,
          rating: fb.rating,
          workloadRating: fb.workloadRating,
          comment: fb.comment,
          approved: fb.approvedAt !== null,
          approvedAt: fb.approvedAt?.toISOString() || null,
          createdAt: fb.createdAt?.toISOString() || '',
          courseId: fb.courseId,
          courseName: fb.courseName,
          courseAcronym: fb.courseAcronym,
          degreeId: fb.degreeId,
          degreeName: fb.degreeName,
          degreeAcronym: fb.degreeAcronym,
          facultyId: fb.facultyId,
          facultyName: fb.facultyName,
          facultyShortName: fb.facultyShortName,
          analysis:
            fb.analysisHasTeaching !== null
              ? {
                  hasTeaching: fb.analysisHasTeaching,
                  hasAssessment: fb.analysisHasAssessment!,
                  hasMaterials: fb.analysisHasMaterials!,
                  hasTips: fb.analysisHasTips!,
                  wordCount: fb.analysisWordCount!,
                  createdAt: fb.analysisCreatedAt?.toISOString(),
                  reviewedAt: fb.analysisReviewedAt?.toISOString() || null,
                  updatedAt: fb.analysisUpdatedAt?.toISOString()
                }
              : null,
          points: fb.pointsAmount !== null ? fb.pointsAmount : null
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
