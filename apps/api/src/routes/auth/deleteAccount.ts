import { authenticateUser } from '@middleware'
import { AuthService } from '@services/authService'
import { clearAuthCookies } from '@utils/authCookies'
import { OpenAPIRoute } from 'chanfana'
import { IRequest } from 'itty-router'
import { z } from 'zod'

export class DeleteAccount extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Delete user account',
    description:
      'Permanently deletes the user account by anonymizing personal data while preserving feedback statistics. This action cannot be undone.',
    responses: {
      '200': {
        description: 'Account deleted successfully',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string()
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
      },
      '500': {
        description: 'Internal server error',
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

  async handle(request: IRequest, env: any, context: any) {
    try {
      // Authenticate user
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck

      const userId = context.user.id

      // Delete user account (anonymize data)
      const authService = new AuthService(env)
      await authService.deleteUserAccount(userId)

      // Clear authentication cookies
      const response = Response.json({
        message: 'Account deleted successfully'
      })
      clearAuthCookies(response)

      return response
    } catch (error) {
      console.error('Delete account error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
