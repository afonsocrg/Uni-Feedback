import { getDb, feedback } from '@uni-feedback/database'
import { CourseFeedbackService, CourseService } from '@services'
import { OpenAPIRoute } from 'chanfana'
import { desc } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const FeedbackSchema = z.object({
  id: z.number(),
  courseId: z.number(),
  rating: z.number(),
  workloadRating: z.number(),
  comment: z.string().nullable(),
  schoolYear: z.number(),
  createdAt: z.string(),
  course: z.object({
    id: z.number(),
    name: z.string(),
    acronym: z.string()
  }),
  degree: z.object({
    id: z.number(),
    name: z.string(),
    acronym: z.string()
  }),
  isFromDifferentCourse: z.boolean()
})

export class GetCourseFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Courses'],
    summary: 'Get all feedback for a course',
    description: 'Returns all feedback entries for a specific course',
    request: {
      params: z.object({
        id: z.number()
      })
    },
    responses: {
      '200': {
        description: 'List of feedback entries for the course',
        content: {
          'application/json': {
            schema: FeedbackSchema.array()
          }
        }
      },
      '404': {
        description: 'Course not found'
      }
    }
  }

  async handle(request: IRequest, env: Env, context: any) {
    const db = getDb(env)
    const courseId = parseInt(request.params.id)
    const courseFeedbackService = new CourseFeedbackService(env)
    const courseService = new CourseService(env)

    // First validate that the course exists
    if (!(await courseService.courseExists(courseId))) {
      return Response.json({ error: 'Course not found' }, { status: 404 })
    }

    const feedbackData = await courseFeedbackService
      .getCourseFeedbackWithDetails(courseId)
      .orderBy(desc(feedback.createdAt))

    // Convert SQLite number (0/1) to proper boolean
    const result = feedbackData.map((item) => ({
      ...item,
      isFromDifferentCourse: Boolean(item.isFromDifferentCourse)
    }))

    return Response.json(result)
  }
}
