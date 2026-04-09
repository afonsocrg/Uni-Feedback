import { AUTH_CONFIG } from '@config/auth'
import { requireAuth } from '@middleware'
import { AuthService } from '@services/authService'
import { clearAuthCookies } from '@utils/authCookies'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { z } from 'zod'

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

  async handle(c: Context) {
    // Use existing auth logic to get session (handles cookie extraction internally)
    const authContext = await requireAuth(c)
    const env = c.env as Env

    // Get access token from cookie
    const accessToken = getCookie(c, `${AUTH_CONFIG.COOKIE_NAME}-access`)

    // Delete the session from database
    if (accessToken) {
      const authService = new AuthService(env)
      await authService.deleteSession(accessToken)
    }

    // Clear authentication cookies
    const response = Response.json({ message: 'Logout successful' })
    clearAuthCookies(response)

    return response
  }
}
