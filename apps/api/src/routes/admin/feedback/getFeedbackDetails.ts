import { courses, degrees, faculties, feedback, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const FeedbackDetailsParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
})

const AdminFeedbackDetailSchema = z.object({
  id: z.number(),
  email: z.string().nullable(),
  schoolYear: z.number().nullable(),
  rating: z.number(),
  workloadRating: z.number().nullable(),
  comment: z.string().nullable(),
  approved: z.boolean(),
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
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

export class GetFeedbackDetails extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Feedback'],
    summary: 'Get detailed feedback information',
    description: 'Retrieve detailed information for a specific feedback entry',
    request: {
      params: FeedbackDetailsParamsSchema
    },
    responses: {
      '200': {
        description: 'Feedback details retrieved successfully',
        content: {
          'application/json': {
            schema: AdminFeedbackDetailSchema
          }
        }
      },
      '404': {
        description: 'Feedback not found',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      '400': {
        description: 'Invalid feedback ID',
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
      const { params } = await this.getValidatedData<typeof this.schema>()
      const { id } = params

      if (!id || isNaN(id)) {
        return Response.json({ error: 'Invalid feedback ID' }, { status: 400 })
      }

      const db = getDb(env)

      // Get feedback with course, degree, and faculty info
      const feedbackResult = await db
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
        .where(eq(feedback.id, id))
        .limit(1)

      if (!feedbackResult.length) {
        return Response.json({ error: 'Feedback not found' }, { status: 404 })
      }

      const fb = feedbackResult[0]

      const response = {
        ...fb,
        approved: fb.approvedAt !== null,
        approvedAt: fb.approvedAt?.toISOString() || null,
        createdAt: fb.createdAt?.toISOString() || '',
        updatedAt: fb.createdAt?.toISOString() || '' // Use createdAt as fallback for updatedAt
      }

      return Response.json(response)
    } catch (error) {
      console.error('Get feedback details error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}