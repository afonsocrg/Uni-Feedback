import { AuthService, EmailService } from '@services'
import { isUniversityEmail, validateReferralCodeFormat } from '@utils'
import { OpenAPIRoute } from 'chanfana'
import { z } from 'zod'

export class RequestMagicLink extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Request magic link for passwordless login',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email: z.string().email(),
              enablePolling: z.boolean().optional(),
              requestId: z.string().optional(),
              referralCode: z.string().optional()
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Magic link sent successfully',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
              requestId: z.string().optional()
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
              data: z.object({
                resetAt: z.string()
              })
            })
          }
        }
      }
    }
  }

  async handle(request: Request, env: Env, context: any) {
    try {
      const data = await this.getValidatedData<typeof this.schema>()
      let { email, requestId: reuseRequestId, referralCode } = data.body
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

      // Check rate limit
      const authService = new AuthService(env)
      const rateLimitResult =
        await authService.checkMagicLinkRateLimit(normalizedEmail)

      if (!rateLimitResult.allowed) {
        return Response.json(
          {
            error: 'Too many requests. Please try again later.',
            data: {
              resetAt: rateLimitResult.resetAt!.toISOString()
            }
          },
          { status: 429 }
        )
      }

      // Create magic link token
      const magicToken = await authService.createMagicLinkToken(
        normalizedEmail,
        reuseRequestId, // Pass requestId (undefined if not provided)
        referralCode // Pass referral code (undefined if not provided or invalid)
      )
      const requestId = magicToken.requestId ?? undefined

      // Send magic link email
      const websiteUrl = env.WEBSITE_URL
      const emailService = new EmailService(env)
      await emailService.sendMagicLinkEmail(
        normalizedEmail,
        magicToken.token,
        websiteUrl
      )

      // Return success
      return Response.json({
        message:
          'If your email is valid, you will receive a sign-in link shortly.',
        ...(requestId && { requestId })
      })
    } catch (error) {
      console.error('Request magic link error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
