import { AuthService } from '@services/authService'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class GetUsers extends OpenAPIRoute {
  schema = {
    tags: ['Users'],
    summary: 'Get all users (superuser only)',
    responses: {
      '200': {
        description: 'Users retrieved successfully',
        content: {
          'application/json': {
            schema: z.array(
              z.object({
                id: z.number(),
                email: z.string(),
                username: z.string(),
                superuser: z.boolean(),
                createdAt: z.string(),
                updatedAt: z.string()
              })
            )
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      '403': {
        description: 'Forbidden - superuser required',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      }
    }
  }

  async handle(request: Request, env: Env, context: any) {
    try {
      const currentUser = context.user

      // Check if user is superuser
      if (!currentUser?.superuser) {
        return Response.json(
          { error: 'Superuser access required' },
          { status: 403 }
        )
      }

      // Get all users using auth service
      const authService = new AuthService(env)
      const users = await authService.getAllUsers()

      // Mask email addresses for privacy
      const maskedUsers = users.map((user) => ({
        ...user
        // email: maskEmail(user.email, { showStart: 2, showEnd: 1 })
      }))

      return Response.json(maskedUsers)
    } catch (error) {
      console.error('Get users error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
