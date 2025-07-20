import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import { AuthService } from '@services/authService'
import { EmailService } from '@services/emailService'

export class Invite extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Invite new user (superuser only)',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email: z.string().email()
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Invitation sent',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string()
            })
          }
        }
      },
      '400': {
        description: 'User already exists',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
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

  async handle(request: Request, env: any, context: any) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const { email } = data.body
      const currentUser = context.user

      // Check if user is superuser
      if (!currentUser?.superuser) {
        return Response.json(
          { error: 'Superuser access required' },
          { status: 403 }
        )
      }

      // Check if user already exists
      const authService = new AuthService(env)
      const existingUser = await authService.findUserByEmail(email)
      if (existingUser) {
        return Response.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }

      // Create invitation token
      const inviteToken = await authService.createUserCreationToken(
        email,
        currentUser.id
      )

      // Send invitation email
      const dashboardUrl = env.DASHBOARD_URL || 'http://localhost:5174'
      const emailService = new EmailService(env)
      await emailService.sendInvitationEmail(
        email,
        inviteToken.token,
        dashboardUrl
      )

      return Response.json({
        message: 'Invitation sent successfully'
      })
    } catch (error) {
      console.error('Invite error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
