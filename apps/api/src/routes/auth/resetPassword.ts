import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'
import { AuthService } from '@services/authService'
import { validatePassword } from '@utils/auth'

export class ResetPassword extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Reset password with token',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              token: z.string(),
              password: z.string().min(8),
              confirmPassword: z.string().min(8)
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Password reset successful',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string()
            })
          }
        }
      },
      '400': {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      '404': {
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
      const { token, password, confirmPassword } = data.body

      // Validate password confirmation
      if (password !== confirmPassword) {
        return Response.json(
          { error: 'Passwords do not match' },
          { status: 400 }
        )
      }

      // Validate password requirements
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        return Response.json(
          { error: passwordValidation.errors.join('. ') },
          { status: 400 }
        )
      }

      // Use the reset token
      const authService = new AuthService(env)
      const success = await authService.usePasswordResetToken(token, password)
      if (!success) {
        return Response.json(
          { error: 'Invalid or expired reset token' },
          { status: 404 }
        )
      }

      return Response.json({
        message: 'Password reset successful'
      })
    } catch (error) {
      console.error('Reset password error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
