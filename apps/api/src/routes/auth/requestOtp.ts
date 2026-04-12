import {
  BadRequestError,
  TooManyRequestsError
} from '@routes/utils/errorHandling'
import { AuthService, EmailService } from '@services'
import { isUniversityEmail, validateReferralCodeFormat } from '@utils'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
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

  async handle(c: Context) {
    const env = c.env as Env
    const data = await this.getValidatedData<typeof this.schema>()
    const { email } = data.body
    let { referralCode } = data.body
    const normalizedEmail = email.toLowerCase()

    // Validate referral code format if provided (silently ignore invalid)
    if (referralCode && !validateReferralCodeFormat(referralCode)) {
      referralCode = undefined
    }

    // Validate email domain against faculty whitelist
    const isValid = await isUniversityEmail(normalizedEmail)

    if (!isValid) {
      throw new BadRequestError('Please use your university email address.')
    }

    // Check rate limit (60 second cooldown)
    const authService = new AuthService(env)
    const rateLimitResult = await authService.checkOtpRateLimit(normalizedEmail)

    if (!rateLimitResult.allowed) {
      throw new TooManyRequestsError(
        'Please wait before requesting another code.',
        { retryAfterSeconds: rateLimitResult.retryAfterSeconds! }
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
  }
}
