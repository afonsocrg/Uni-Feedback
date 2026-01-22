import { AuthService, EmailService } from '@services'
import { isUniversityEmail, validateReferralCodeFormat } from '@utils'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class RequestOtp extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Request OTP code for passwordless login',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email: z.string().email(),
              referralCode: z.string().optional()
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'OTP sent successfully',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string()
            })
          }
        }
      },
      '400': {
        description: 'Invalid email domain',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      '429': {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string(),
              retryAfterSeconds: z.number()
            })
          }
        }
      }
    }
  }

  async handle(request: Request, env: Env, context: any) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      let { email, referralCode } = data.body
      const normalizedEmail = email.toLowerCase()

      // Validate referral code format if provided (silently ignore invalid)
      if (referralCode && !validateReferralCodeFormat(referralCode)) {
        referralCode = undefined
      }

      // Validate email domain against faculty whitelist
      const isValid = await isUniversityEmail(normalizedEmail)

      if (!isValid) {
        return Response.json(
          {
            error: 'Please use your university email address.'
          },
          { status: 400 }
        )
      }

      // Check rate limit (60 second cooldown)
      const authService = new AuthService(env)
      const rateLimitResult =
        await authService.checkOtpRateLimit(normalizedEmail)

      if (!rateLimitResult.allowed) {
        return Response.json(
          {
            error: 'Please wait before requesting another code.',
            retryAfterSeconds: rateLimitResult.retryAfterSeconds!
          },
          { status: 429 }
        )
      }

      // Create OTP token
      const otpToken = await authService.createOtpToken(
        normalizedEmail,
        referralCode
      )

      // Send OTP email
      const emailService = new EmailService(env)
      await emailService.sendOtpEmail(normalizedEmail, otpToken.otp)

      // Return success
      return Response.json({
        message:
          'If your email is valid, you will receive a verification code shortly.'
      })
    } catch (error) {
      console.error('Request OTP error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
