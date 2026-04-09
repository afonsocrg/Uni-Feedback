import { requireSuperuser } from '@middleware'
import { AuthService } from '@services/authService'
import { OpenAPIRoute } from 'chanfana'
import { IRequest } from 'itty-router'
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

  async handle(request: IRequest, env: Env, context: RequestContext) {
    await requireSuperuser(request, env, context)

    // Get all users using auth service
    const authService = new AuthService(env)
    const users = await authService.getAllUsers()

    // Mask email addresses for privacy
    const maskedUsers = users.map((user) => ({
      ...user
      // email: maskEmail(user.email, { showStart: 2, showEnd: 1 })
    }))

    return Response.json(maskedUsers)
  }
}
