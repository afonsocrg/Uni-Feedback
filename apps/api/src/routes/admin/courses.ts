import { DatabaseService } from '@services/databaseService'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class GetAdminCourses extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Get all courses for admin dashboard',
    request: {
      query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('20'),
        search: z.string().optional(),
        facultyId: z.string().optional(),
        degreeId: z.string().optional()
      })
    },
    responses: {
      '200': {
        description: 'List of courses',
        content: {
          'application/json': {
            schema: z.object({
              courses: z.array(z.object({
                id: z.number(),
                name: z.string(),
                code: z.string(),
                credits: z.number(),
                semester: z.string(),
                schoolYear: z.string(),
                degreeId: z.number(),
                degreeName: z.string(),
                facultyName: z.string(),
                feedbackCount: z.number(),
                averageRating: z.number().nullable()
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
      const { page: pageStr, limit: limitStr, search, facultyId, degreeId } = data.query
      
      const page = parseInt(pageStr)
      const limit = Math.min(parseInt(limitStr), 100)
      const offset = (page - 1) * limit

      const dbService = new DatabaseService(env)
      const result = await dbService.getCoursesForAdmin({
        limit,
        offset,
        search,
        facultyId: facultyId ? parseInt(facultyId) : undefined,
        degreeId: degreeId ? parseInt(degreeId) : undefined
      })

      const totalPages = Math.ceil(result.total / limit)

      return Response.json({
        courses: result.courses,
        total: result.total,
        page,
        limit,
        totalPages
      })
    } catch (error) {
      console.error('Get admin courses error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}