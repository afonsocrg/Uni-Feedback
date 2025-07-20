import { courses, getDb } from '@db'
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
  rating: z.number(),
  feedbackCount: z.number(),
  terms: z.array(z.string())
})

export class GetDegreeCourses extends OpenAPIRoute {
  schema = {
    tags: ['Courses'],
    summary: 'Get all courses with aggregated feedback data',
    description:
      'Returns a list of all courses with their average rating and feedback count',
    request: {
      query: z.object({
        acronym: z.string().optional()
      }),
      params: z.object({
        id: z.number()
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
      query: { acronym },
      params: { id: degreeId }
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
    const baseQuery = db
      .select({
        id: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        url: courses.url,
        rating: sql<number>`ifnull(avg(${feedbackJoin.table.rating}), 0)`.as(
          'rating'
        ),
        feedbackCount:
          sql<number>`ifnull(count(distinct ${feedbackJoin.table.id}), 0)`.as(
            'feedback_count'
          ),
        degreeId: courses.degreeId,
        terms: courses.terms
      })
      .from(courses)
      .leftJoin(feedbackJoin.table, feedbackJoin.condition)
      .groupBy(courses.id)

    const query = baseQuery.where(
      conditions.length > 0 ? and(...conditions) : undefined
    )

    const result = await query

    return Response.json(result)
  }
}
