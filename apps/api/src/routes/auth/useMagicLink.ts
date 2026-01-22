import { MAGIC_LINK_CONFIG } from '@config/auth'
import { AuthService } from '@services/authService'
import { setAuthCookies } from '@utils/authCookies'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

/**
 * @deprecated Magic links are being replaced by OTP authentication.
 * This endpoint is kept for backward compatibility only.
 */
export class UseMagicLink extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Use magic link token from email and create session',
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
              error: z.string(),
              requestId: z.string().optional()
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

      // Try to find valid token
      const sessionData = await authService.useMagicLinkToken(token)

      if (!sessionData) {
        // Check if token exists but is expired (to return requestId)
        const expiredToken =
          await authService.findMagicLinkTokenIncludingExpired(token)

        // Prepare base error response
        const errorResponse: { error: string; requestId?: string } = {
          error: 'The link you provided is invalid or has already been used.'
        }

        // If token exists and is expired, conditionally include requestId
        if (expiredToken && expiredToken.expiresAt < new Date()) {
          // Only return requestId if token was created recently
          const now = new Date()
          const recentWindowStart = new Date(
            now.getTime() - MAGIC_LINK_CONFIG.EXPIRED_TOKEN_REQUESTID_WINDOW_MS
          )
          const isRecent = expiredToken.createdAt > recentWindowStart

          // Include requestId if token is recent and has one
          if (isRecent && expiredToken.requestId) {
            errorResponse.requestId = expiredToken.requestId
          }
        }

        return Response.json(errorResponse, { status: 400 })
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
