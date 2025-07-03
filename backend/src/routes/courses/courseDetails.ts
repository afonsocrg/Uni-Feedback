import { courses, degrees, feedback, getDb } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const DegreeSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  facultyId: z.number()
})

const CourseDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  description: z.string(),
  url: z.string(),
  rating: z.number(),
  feedbackCount: z.number(),
  terms: z.array(z.string()),
  assessment: z.string(),
  degree: DegreeSchema.nullable()
})

export class GetCourse extends OpenAPIRoute {
  schema = {
    tags: ['Courses'],
    summary: 'Get detailed information about a course',
    description:
      'Returns detailed information about a specific course including its average rating and feedback count',
    request: {
      params: z.object({
        id: z.number()
      })
    },
    responses: {
      '200': {
        description: 'Course details with aggregated feedback data',
        content: {
          'application/json': {
            schema: CourseDetailSchema
          }
        }
      },
      '404': {
        description: 'Course not found'
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    const db = getDb(env)
    const courseId = parseInt(request.params.id)

    const result = await db
      .select({
        id: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        description: courses.description,
        degreeId: courses.degreeId,
        url: courses.url,
        rating: sql<number>`ifnull(avg(${feedback.rating}), 0)`.as('rating'),
        feedbackCount: sql<number>`ifnull(count(${feedback.id}), 0)`.as(
          'feedback_count'
        ),
        terms: courses.terms,
        assessment: courses.assessment,
        degree: {
          id: degrees.id,
          name: degrees.name,
          acronym: degrees.acronym,
          facultyId: degrees.facultyId
        }
      })
      .from(courses)
      .leftJoin(
        feedback,
        and(eq(courses.id, feedback.courseId), isNotNull(feedback.approvedAt))
      )
      .leftJoin(degrees, eq(courses.degreeId, degrees.id))
      .where(eq(courses.id, courseId))
      .groupBy(courses.id)

    if (result.length === 0) {
      return Response.json({ error: 'Course not found' }, { status: 404 })
    }

    return Response.json(result[0])
  }
}
