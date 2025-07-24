import { DatabaseService } from '@services/databaseService'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class GetAdminFaculties extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Get all faculties for admin dashboard',
    request: {
      query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('20'),
        search: z.string().optional()
      })
    },
    responses: {
      '200': {
        description: 'List of faculties',
        content: {
          'application/json': {
            schema: z.object({
              faculties: z.array(z.object({
                id: z.number(),
                name: z.string(),
                code: z.string(),
                description: z.string().nullable(),
                degreeCount: z.number(),
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
      const { page: pageStr, limit: limitStr, search } = data.query
      
      const page = parseInt(pageStr)
      const limit = Math.min(parseInt(limitStr), 100)
      const offset = (page - 1) * limit

      const dbService = new DatabaseService(env)
      const result = await dbService.getFacultiesForAdmin({
        limit,
        offset,
        search
      })

      const totalPages = Math.ceil(result.total / limit)

      return Response.json({
        faculties: result.faculties,
        total: result.total,
        page,
        limit,
        totalPages
      })
    } catch (error) {
      console.error('Get admin faculties error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}