import { DatabaseService } from '@services/databaseService'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class GetAdminFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Get all feedback for admin dashboard',
    request: {
      query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('20'),
        search: z.string().optional(),
        courseId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
      })
    },
    responses: {
      '200': {
        description: 'List of feedback',
        content: {
          'application/json': {
            schema: z.object({
              feedback: z.array(z.object({
                id: z.number(),
                courseId: z.number(),
                courseName: z.string(),
                courseCode: z.string(),
                degreeName: z.string(),
                facultyName: z.string(),
                overallRating: z.number(),
                difficultyRating: z.number(),
                workloadRating: z.number(),
                comment: z.string().nullable(),
                schoolYear: z.string(),
                semester: z.string(),
                createdAt: z.string()
              })),
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              totalPages: z.number()
            })
          }
        }
      }
    }
  }

  async handle(request: Request, env: any, context: any) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const { page: pageStr, limit: limitStr, search, courseId, startDate, endDate } = data.query
      
      const page = parseInt(pageStr)
      const limit = Math.min(parseInt(limitStr), 100)
      const offset = (page - 1) * limit

      const dbService = new DatabaseService(env)
      const result = await dbService.getFeedbackForAdmin({
        limit,
        offset,
        search,
        courseId: courseId ? parseInt(courseId) : undefined,
        startDate,
        endDate
      })

      const totalPages = Math.ceil(result.total / limit)

      return Response.json({
        feedback: result.feedback,
        total: result.total,
        page,
        limit,
        totalPages
      })
    } catch (error) {
      console.error('Get admin feedback error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}