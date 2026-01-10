import { AUTH_CONFIG } from '@config/auth'
import { AuthService } from '@services/authService'
import { setAuthCookies } from '@utils/authCookies'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class Refresh extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Refresh access token',
    responses: {
      '200': {
        description: 'Token refreshed successfully',
        content: {
          'application/json': {
            schema: z.object({
              user: z.object({
                id: z.number(),
                email: z.string(),
                username: z.string(),
                superuser: z.boolean(),
                referralCode: z.string()
              })
            })
          }
        }
      },
      '401': {
        description: 'Invalid refresh token',
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
      // Get refresh token from cookie
      const cookies = request.headers.get('Cookie') || ''
      const refreshTokenMatch = cookies.match(
        new RegExp(`${AUTH_CONFIG.COOKIE_NAME}-refresh=([^;]+)`)
      )
      const refreshToken = refreshTokenMatch?.[1]

      if (!refreshToken) {
        return Response.json(
          { error: 'No refresh token provided' },
          { status: 401 }
        )
      }

      // Refresh the session
      const authService = new AuthService(env)
      const session = await authService.refreshSession(refreshToken)
      if (!session) {
        return Response.json(
          { error: 'Invalid refresh token' },
          { status: 401 }
        )
      }

      // Get user data
      const sessionWithUser = await authService.findSessionByAccessToken(
        session.accessToken
      )
      if (!sessionWithUser) {
        return Response.json({ error: 'Session not found' }, { status: 401 })
      }

      // Set new tokens in cookies
      const response = Response.json({
        user: {
          id: sessionWithUser.user.id,
          email: sessionWithUser.user.email,
          username: sessionWithUser.user.username,
          superuser: sessionWithUser.user.superuser,
          referralCode: sessionWithUser.user.referralCode
        }
      })

      // Set new authentication cookies
      setAuthCookies(response, session)

      return response
    } catch (error) {
      console.error('Refresh error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
