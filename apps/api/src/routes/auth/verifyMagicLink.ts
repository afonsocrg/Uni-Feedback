import { AuthService } from '@services/authService'
import { setAuthCookies } from '@utils/authCookies'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

/**
 * @deprecated Magic links are being replaced by OTP authentication.
 * This endpoint is kept for backward compatibility only.
 */
export class VerifyMagicLink extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Verify magic link with requestId (polling endpoint)',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              requestId: z.string()
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Request status or session created',
        content: {
          'application/json': {
            schema: z.union([
              z.object({
                status: z.literal('pending')
              }),
              z.object({
                user: z.object({
                  id: z.number(),
                  email: z.string(),
                  username: z.string(),
                  role: z.string()
                })
              })
            ])
          }
        }
      }
    }
  }

  async handle(request: Request, env: any, context: any) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const { requestId } = data.body

      const authService = new AuthService(env)
      const sessionData =
        await authService.verifyMagicLinkByRequestId(requestId)

      // Return pending for: invalid, expired, not clicked, or already consumed
      // This prevents timing attacks and information leakage
      if (!sessionData) {
        return Response.json({ status: 'pending' })
      }

      // Session ready - return user data and set cookies
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
      console.error('Verify magic link by requestId error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
