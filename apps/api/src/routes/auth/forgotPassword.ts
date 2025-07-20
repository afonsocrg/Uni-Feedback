import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import { AuthService } from '@services/authService'
import { EmailService } from '@services/emailService'

export class ForgotPassword extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Request password reset',
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
        description:
          'Password reset email sent (or user not found - same response for security)',
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
      const data = await this.getValidatedData<typeof this.schema>()
      const { email } = data.body

      // Find user by email
      const authService = new AuthService(env)
      const user = await authService.findUserByEmail(email)

      if (user) {
        // Create password reset token
        const resetToken = await authService.createPasswordResetToken(user.id)

        // Send password reset email
        const dashboardUrl = env.DASHBOARD_URL || 'http://localhost:5174'
        const emailService = new EmailService(env)
        await emailService.sendPasswordResetEmail(
          email,
          user.username,
          resetToken.token,
          dashboardUrl
        )
      }

      // Always return success to prevent email enumeration
      return Response.json({
        message:
          'If an account with that email exists, a password reset link has been sent.'
      })
    } catch (error) {
      console.error('Forgot password error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
