import { requireAuth } from '@middleware'
import { OpenAPIRoute } from 'chanfana'
import { IRequest } from 'itty-router'
import { z } from 'zod'

export class GetProfile extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Get current user profile',
    responses: {
      '200': {
        description: 'User profile retrieved successfully',
        content: {
          'application/json': {
            schema: z.object({
              user: z.object({
                id: z.number(),
                email: z.string(),
                username: z.string(),
                role: z.string(),
                superuser: z.boolean(),
                referralCode: z.string().nullable()
              })
            })
          }
        }
      },
      '401': {
        description: 'Authentication required',
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
    // Authenticate user
    // Return user data from context
    const authContext = await requireAuth(request, env, context)
    const user = authContext.user!

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        referralCode: user.referralCode
      }
    })
  }
}
