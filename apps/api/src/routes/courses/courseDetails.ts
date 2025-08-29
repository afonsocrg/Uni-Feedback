import { courses, degrees, getDb } from '@uni-feedback/database'
import { CourseFeedbackService } from '@services'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
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
  ects: z.number().nullable(),
  hasMandatoryExam: z.boolean().nullable(),
  url: z.string(),
  terms: z.array(z.string()),
  description: z.string(),
  assessment: z.string(),
  bibliography: z.string().optional(),
  degree: DegreeSchema.nullable(),
  totalFeedbackCount: z.number(),
  averageRating: z.number(),
  averageWorkload: z.number().nullable()
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
    const courseFeedbackService = new CourseFeedbackService(env)

    // Get course details
    const courseResult = await db
      .select({
        id: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        ects: courses.ects,
        hasMandatoryExam: courses.hasMandatoryExam,
        url: courses.url,
        terms: courses.terms,
        description: courses.description,
        assessment: courses.assessment,
        bibliography: courses.bibliography,
        degreeId: courses.degreeId,
        degree: {
          id: degrees.id,
          name: degrees.name,
          acronym: degrees.acronym,
          facultyId: degrees.facultyId
        }
      })
      .from(courses)
      .leftJoin(degrees, eq(courses.degreeId, degrees.id))
      .where(eq(courses.id, courseId))

    if (courseResult.length === 0) {
      return Response.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get aggregated feedback stats including related courses
    const feedbackStats =
      await courseFeedbackService.getCourseFeedbackStats(courseId)

    const result = {
      ...courseResult[0],
      averageRating: feedbackStats.averageRating,
      totalFeedbackCount: feedbackStats.totalFeedbackCount,
      averageWorkload: feedbackStats.averageWorkload
    }

    return Response.json(result)
  }
}
