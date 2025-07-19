import { getDb, feedbackDrafts } from '@db'
import { OpenAPIRoute } from 'chanfana'
import { eq, lt } from 'drizzle-orm'
import { IRequest } from 'itty-router'
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

  async handle(request: IRequest, env: any, context: any) {
    try {
      const db = getDb(env)
      const code = request.params.code.toUpperCase()

      // Clean up expired codes first (optional cleanup)
      await db
        .delete(feedbackDrafts)
        .where(lt(feedbackDrafts.expiresAt, new Date()))

      // Find the feedback draft
      const result = await db
        .select()
        .from(feedbackDrafts)
        .where(eq(feedbackDrafts.code, code))
        .limit(1)

      if (result.length === 0) {
        return Response.json(
          { error: 'Code not found or expired' },
          { status: 404 }
        )
      }

      const feedbackDraft = result[0]

      // Check if expired
      if (feedbackDraft.expiresAt < new Date()) {
        // Delete expired code
        await db
          .delete(feedbackDrafts)
          .where(eq(feedbackDrafts.id, feedbackDraft.id))

        return Response.json(
          { error: 'Code not found or expired' },
          { status: 404 }
        )
      }

      // Mark as used (optional tracking)
      await db
        .update(feedbackDrafts)
        .set({ usedAt: new Date() })
        .where(eq(feedbackDrafts.id, feedbackDraft.id))

      // Parse and return the data
      const data = JSON.parse(feedbackDraft.data)

      return Response.json(data, { status: 200 })
    } catch (error: unknown) {
      console.error('Error retrieving feedback draft:', error)
      return Response.json(
        { error: 'Failed to retrieve feedback draft data' },
        { status: 500 }
      )
    }
  }
}
