import { DatabaseService } from '@services/databaseService'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class GetAdminDegrees extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Get all degrees for admin dashboard',
    request: {
      query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('20'),
        search: z.string().optional(),
        facultyId: z.string().optional()
      })
    },
    responses: {
      '200': {
        description: 'List of degrees',
        content: {
          'application/json': {
            schema: z.object({
              degrees: z.array(z.object({
                id: z.number(),
                name: z.string(),
                code: z.string(),
                type: z.string(),
                facultyId: z.number(),
                facultyName: z.string(),
                courseCount: z.number(),
                feedbackCount: z.number(),
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
      const { page: pageStr, limit: limitStr, search, facultyId } = data.query
      
      const page = parseInt(pageStr)
      const limit = Math.min(parseInt(limitStr), 100)
      const offset = (page - 1) * limit

      const dbService = new DatabaseService(env)
      const result = await dbService.getDegreesForAdmin({
        limit,
        offset,
        search,
        facultyId: facultyId ? parseInt(facultyId) : undefined
      })

      const totalPages = Math.ceil(result.total / limit)

      return Response.json({
        degrees: result.degrees,
        total: result.total,
        page,
        limit,
        totalPages
      })
    } catch (error) {
      console.error('Get admin degrees error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}