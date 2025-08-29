import { courses, degrees, faculties, getDb } from '@uni-feedback/database'
import { CourseFeedbackService } from '@services'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const CourseResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  url: z.string(),
  averageRating: z.number(),
  averageWorkload: z.number().nullable(),
  totalFeedbackCount: z.number(),
  terms: z.array(z.string()),
  hasMandatoryExam: z.boolean().nullable()
})

export class GetCourses extends OpenAPIRoute {
  schema = {
    tags: ['Courses'],
    summary: 'Get all courses with aggregated feedback data',
    description:
      'Returns a list of all courses with their average rating and feedback count',
    request: {
      query: z.object({
        acronym: z.string().optional(),
        degreeId: z.number().optional(),
        faculty: z.string().optional(),
        degree: z.string().optional()
      })
    },
    responses: {
      '200': {
        description: 'List of courses with aggregated feedback data',
        content: {
          'application/json': {
            schema: CourseResponseSchema.array()
          }
        }
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    const db = getDb(env)
    const courseFeedbackService = new CourseFeedbackService(env)

    const data = await this.getValidatedData<typeof this.schema>()
    const {
      query: { acronym, degreeId, faculty, degree }
    } = data

    const conditions = []
    if (acronym) {
      conditions.push(sql`lower(${courses.acronym}) = lower(${acronym})`)
    }

    if (degreeId) {
      conditions.push(eq(courses.degreeId, degreeId))
    }

    // Get enhanced feedback join that includes related courses
    const feedbackJoin = courseFeedbackService.getEnhancedFeedbackJoin()

    // Base query with enhanced feedback join
    let baseQuery = db
      .select({
        id: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        url: courses.url,
        averageRating:
          sql<number>`ifnull(avg(${feedbackJoin.table.rating}), 0)`.as(
            'average_rating'
          ),
        averageWorkload: sql<
          number | null
        >`ifnull(avg(${feedbackJoin.table.workloadRating}), 0)`.as(
          'average_workload'
        ),
        totalFeedbackCount:
          sql<number>`ifnull(count(distinct ${feedbackJoin.table.id}), 0)`.as(
            'total_feedback_count'
          ),
        degreeId: courses.degreeId,
        terms: courses.terms,
        hasMandatoryExam: courses.hasMandatoryExam
      })
      .from(courses)
      .leftJoin(feedbackJoin.table, feedbackJoin.condition)

    // Add joins for faculty/degree filtering
    if (faculty || degree) {
      baseQuery = baseQuery.innerJoin(degrees, eq(courses.degreeId, degrees.id))

      if (faculty) {
        baseQuery = baseQuery.innerJoin(
          faculties,
          eq(degrees.facultyId, faculties.id)
        )
        conditions.push(eq(faculties.shortName, faculty))
      }

      if (degree) {
        conditions.push(eq(degrees.acronym, degree))
      }
    }

    const query = baseQuery
      .groupBy(courses.id)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const result = await query

    return Response.json(result)
  }
}
