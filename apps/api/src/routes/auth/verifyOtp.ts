import { AuthService } from '@services/authService'
import { setAuthCookies } from '@utils/authCookies'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class VerifyOtp extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Verify OTP code and create session',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email: z.string().email(),
              otp: z.string().length(6)
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'OTP verified, session created',
        content: {
          'application/json': {
            schema: z.object({
              user: z.object({
                id: z.number(),
                email: z.string(),
                username: z.string(),
                role: z.string(),
                referralCode: z.string().nullable()
              })
            })
          }
        }
      },
      '400': {
        description: 'Invalid or expired OTP',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string(),
              attemptsRemaining: z.number().optional()
            })
          }
        }
      }
    }
  }

  async handle(request: Request, env: any, context: any) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      const { email, otp } = data.body

      const authService = new AuthService(env)

      // Verify OTP
      const result = await authService.verifyOtpToken(email, otp)

      // Check if verification failed
      if ('error' in result) {
        const errorResponse: { error: string; attemptsRemaining?: number } = {
          error: result.error
        }
        if (result.attemptsRemaining !== undefined) {
          errorResponse.attemptsRemaining = result.attemptsRemaining
        }
        return Response.json(errorResponse, { status: 400 })
      }

      // Success - create response with user data
      const response = Response.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: result.user.role,
          referralCode: result.user.referralCode
        }
      })

      // Set auth cookies
      setAuthCookies(response, result)

      return response
    } catch (error) {
      console.error('Verify OTP error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
