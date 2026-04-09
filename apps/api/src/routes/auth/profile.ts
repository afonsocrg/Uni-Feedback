import { requireAuth } from '@middleware'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
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

  async handle(c: Context) {
    // Authenticate user
    // Return user data from context
    const authContext = await requireAuth(c)
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
