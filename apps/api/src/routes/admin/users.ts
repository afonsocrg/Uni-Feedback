import { DatabaseService } from '@services/databaseService'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class GetAdminUsers extends OpenAPIRoute {
  schema = {
    tags: ['Admin'],
    summary: 'Get all users for admin dashboard',
    request: {
      query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('20'),
        search: z.string().optional()
      })
    },
    responses: {
      '200': {
        description: 'List of users',
        content: {
          'application/json': {
            schema: z.object({
              users: z.array(z.object({
                id: z.number(),
                email: z.string(),
                username: z.string(),
                superuser: z.boolean(),
                createdAt: z.string(),
                lastLoginAt: z.string().nullable()
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
      const limit = Math.min(parseInt(limitStr), 100) // Max 100 per page
      const offset = (page - 1) * limit

      const dbService = new DatabaseService(env)
      const result = await dbService.getUsers({
        limit,
        offset,
        search
      })

      const totalPages = Math.ceil(result.total / limit)

      return Response.json({
        users: result.users,
        total: result.total,
        page,
        limit,
        totalPages
      })
    } catch (error) {
      console.error('Get admin users error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}