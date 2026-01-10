import { AuthService } from '@services/authService'
import { setAuthCookies } from '@utils/authCookies'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class Login extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Login user',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email: z.string().email(),
              password: z.string().min(1)
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Login successful',
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
      '401': {
        description: 'Invalid credentials',
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
      const { email, password } = data.body

      // Verify credentials
      const authService = new AuthService(env)
      const user = await authService.verifyCredentials(email, password)
      if (!user) {
        return Response.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Create session
      const session = await authService.createSession(user.id)

      // Set access token in cookie
      const response = Response.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          superuser: user.superuser,
          referralCode: user.referralCode
        }
      })

      // Set authentication cookies
      setAuthCookies(response, session)

      return response
    } catch (error) {
      console.error('Login error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
