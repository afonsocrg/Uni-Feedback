import { requireSuperuser } from '@middleware'
import { AuthService } from '@services/authService'
import { EmailService } from '@services/emailService'
import { OpenAPIRoute } from 'chanfana'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { AlreadyExistsError } from '../utils'

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

  async handle(request: IRequest, env: Env, context: RequestContext) {
    const authContext = await requireSuperuser(request, env, context)
    const data = await this.getValidatedData<typeof this.schema>()
    const { email } = data.body

    // Check if user already exists
    const authService = new AuthService(env)
    const existingUser = await authService.findUserByEmail(email)
    if (existingUser) {
      throw new AlreadyExistsError('User with this email already exists')
    }

    // Create invitation token
    const inviteToken = await authService.createUserCreationToken(
      email,
      authContext.user.id
    )

    // Send invitation email
    const dashboardUrl = env.DASHBOARD_URL
    const emailService = new EmailService(env)
    await emailService.sendInvitationEmail(
      email,
      inviteToken.token,
      dashboardUrl
    )

    return Response.json({
      message: 'Invitation sent successfully'
    })
  }
}
