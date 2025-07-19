import { feedbackDrafts, getDb } from '@db'
import { contentJson, OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z, ZodError } from 'zod'

const FeedbackDraftRequestSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    workloadRating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional()
  })
  .strict()

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars: 0, O, 1, I
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export class CreateFeedbackDraft extends OpenAPIRoute {
  schema = {
    tags: ['Feedback Drafts'],
    summary: 'Create a feedback draft code for form data',
    description:
      'Creates a temporary code that can be used to prefill course feedback forms',
    request: {
      body: contentJson(FeedbackDraftRequestSchema)
    },
    responses: {
      '201': {
        description: 'Feedback draft created successfully',
        content: {
          'application/json': {
            schema: z.object({
              code: z.string(),
              expiresAt: z.string()
            })
          }
        }
      },
      '400': {
        description: 'Invalid input data'
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    try {
      const db = getDb(env)
      const { body } = await this.getValidatedData<typeof this.schema>()

      // Generate unique code
      let code: string
      let attempts = 0
      const maxAttempts = 10

      do {
        code = generateCode()
        attempts++

        if (attempts > maxAttempts) {
          return Response.json(
            { error: 'Failed to generate unique code' },
            { status: 500 }
          )
        }

        // Check if code already exists
        const existing = await db
          .select()
          .from(feedbackDrafts)
          .where(eq(feedbackDrafts.code, code))
          .limit(1)

        if (existing.length === 0) break
      } while (true)

      // Set expiration to 24 hours from now
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // Get client IP for rate limiting (optional)
      const ipAddress =
        request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For') ||
        'unknown'

      // Insert feedback draft
      await db.insert(feedbackDrafts).values({
        code,
        data: JSON.stringify(body),
        expiresAt,
        ipAddress
      })

      return Response.json(
        {
          code,
          expiresAt: expiresAt.toISOString()
        },
        { status: 201 }
      )
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return Response.json({ error }, { status: 400 })
      }

      console.error('Error creating feedback draft:', error)
      return Response.json(
        { error: 'Failed to create feedback draft' },
        { status: 500 }
      )
    }
  }
}
