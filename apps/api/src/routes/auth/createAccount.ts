import { BadRequestError, NotFoundError } from '@routes/utils/errorHandling'
import { AuthService } from '@services/authService'
import { validatePassword } from '@utils/auth'
import { setAuthCookies } from '@utils/authCookies'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class CreateAccount extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Create account with invitation token',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              token: z.string(),
              username: z.string().min(1),
              password: z.string().min(8),
              confirmPassword: z.string().min(8)
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Account created successfully',
        content: {
          'application/json': {
            schema: z.object({
              user: z.object({
                id: z.number(),
                email: z.string(),
                username: z.string(),
                superuser: z.boolean()
              })
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
    const { token, username, password, confirmPassword } = data.body

    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match')
    }

    // Validate password requirements
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      throw new BadRequestError(passwordValidation.errors.join('. '))
    }

    // Validate username
    if (!username.trim()) {
      throw new BadRequestError('Username is required')
    }

    // Use the creation token to create user
    const authService = new AuthService(env)
    const user = await authService.useUserCreationToken(token, {
      username,
      password
    })
    if (!user) {
      throw new NotFoundError('Invalid or expired invitation token')
    }

    // Create session for the new user
    const session = await authService.createSession(user.id)

    // Set cookies and return user data
    const response = Response.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        superuser: user.superuser
      }
    })

    // Set authentication cookies
    setAuthCookies(response, session)

    return response
  }
}
