import { BadRequestError, NotFoundError } from '@routes/utils/errorHandling'
import { AuthService } from '@services/authService'
import { validatePassword } from '@utils/auth'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

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

  async handle(_request: Request, env: Env, _context: RequestContext) {
    const data = await this.getValidatedData<typeof this.schema>()
    const { token, password, confirmPassword } = data.body

    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match')
    }

    // Validate password requirements
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      throw new BadRequestError(passwordValidation.errors.join('. '))
    }

    // Use the reset token
    const authService = new AuthService(env)
    const success = await authService.usePasswordResetToken(token, password)
    if (!success) {
      throw new NotFoundError('Invalid or expired reset token')
    }

    return Response.json({
      message: 'Password reset successful'
    })
  }
}
