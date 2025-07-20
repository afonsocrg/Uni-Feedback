import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import { AuthService } from '@services/authService'
import { AUTH_CONFIG } from '@config/auth'
import { clearAuthCookies } from '@utils/authCookies'

export class Logout extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Logout user',
    responses: {
      '200': {
        description: 'Logout successful',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string()
            })
          }
        }
      }
    }
  }

  async handle(request: Request, env: any, context: any) {
    try {
      // Get access token from cookie
      const cookies = request.headers.get('Cookie') || ''
      const accessTokenMatch = cookies.match(
        new RegExp(`${AUTH_CONFIG.COOKIE_NAME}-access=([^;]+)`)
      )
      const accessToken = accessTokenMatch?.[1]

      if (accessToken) {
        // Delete the session
        const authService = new AuthService(env)
        await authService.deleteSession(accessToken)
      }

      // Clear authentication cookies
      const response = Response.json({ message: 'Logout successful' })
      clearAuthCookies(response)

      return response
    } catch (error) {
      console.error('Logout error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
