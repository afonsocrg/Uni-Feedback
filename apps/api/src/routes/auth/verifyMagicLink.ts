import { AuthService } from '@services/authService'
import { setAuthCookies } from '@utils/authCookies'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class VerifyMagicLink extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Verify magic link token and create session',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              token: z.string().min(1)
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Magic link verified, session created',
        content: {
          'application/json': {
            schema: z.object({
              user: z.object({
                id: z.number(),
                email: z.string(),
                username: z.string(),
                role: z.string()
              })
            })
          }
        }
      },
      '400': {
        description: 'Invalid or expired token',
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

  async handle(request: Request, env: any, context: any) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const { token } = data.body

      const authService = new AuthService(env)
      const sessionData = await authService.useMagicLinkToken(token)

      if (!sessionData) {
        return Response.json(
          {
            error:
              'The link you provided is invalid or has expired. Please request a new one.'
          },
          { status: 400 }
        )
      }

      // Create response with user data
      const response = Response.json({
        user: {
          id: sessionData.user.id,
          email: sessionData.user.email,
          username: sessionData.user.username,
          role: sessionData.user.role
        }
      })

      // Set auth cookies
      setAuthCookies(response, sessionData)

      return response
    } catch (error) {
      console.error('Verify magic link error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
