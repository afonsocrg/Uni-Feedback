import { NotFoundError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import { feedbackDrafts } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq, lt } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

export class GetFeedbackDraft extends OpenAPIRoute {
  schema = {
    tags: ['Feedback Drafts'],
    summary: 'Get feedback draft data by code',
    description: 'Retrieves form prefill data using a temporary code',
    request: {
      params: z.object({
        code: z.string().length(8)
      })
    },
    responses: {
      '200': {
        description: 'Feedback draft data retrieved successfully',
        content: {
          'application/json': {
            schema: z.object({
              rating: z.number().int().min(1).max(5).optional(),
              workloadRating: z.number().int().min(1).max(5).optional(),
              comment: z.string().optional()
            })
          }
        }
      },
      '404': {
        description: 'Code not found or expired'
      }
    }
  }

  async handle(c: Context) {
    const { params } = await this.getValidatedData<typeof this.schema>()
    const code = params.code.toUpperCase()

    // Clean up expired codes first (optional cleanup)
    await database()
      .delete(feedbackDrafts)
      .where(lt(feedbackDrafts.expiresAt, new Date()))

    // Find the feedback draft
    const result = await database()
      .select()
      .from(feedbackDrafts)
      .where(eq(feedbackDrafts.code, code))
      .limit(1)

    if (result.length === 0) {
      throw new NotFoundError('Code not found or expired')
    }

    const feedbackDraft = result[0]

    // Check if expired
    if (feedbackDraft.expiresAt < new Date()) {
      // Delete expired code
      await database()
        .delete(feedbackDrafts)
        .where(eq(feedbackDrafts.id, feedbackDraft.id))

      throw new NotFoundError('Code not found or expired')
    }

    // Mark as used (optional tracking)
    await database()
      .update(feedbackDrafts)
      .set({ usedAt: new Date() })
      .where(eq(feedbackDrafts.id, feedbackDraft.id))

    // Return the data (already parsed from jsonb)
    return Response.json(feedbackDraft.data, { status: 200 })
  }
}
