import { requireAuth } from '@middleware'
import { database } from '@uni-feedback/db'
import { helpfulVotes } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

export class RemoveHelpfulVote extends OpenAPIRoute {
  schema = {
    tags: ['Feedback'],
    summary: 'Remove helpful vote',
    description: 'Remove your helpful vote from a feedback submission',
    request: {
      params: z.object({ id: z.number() })
    },
    responses: {
      '200': { description: 'Vote removed successfully' },
      '401': { description: 'Not authenticated' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const userId = authContext.user.id
    const { params } = await this.getValidatedData<typeof this.schema>()
    const feedbackId = params.id

    // Delete vote if exists (idempotent)
    await database()
      .delete(helpfulVotes)
      .where(
        and(
          eq(helpfulVotes.userId, userId),
          eq(helpfulVotes.feedbackId, feedbackId)
        )
      )

    return Response.json({
      message: 'Vote removed'
    })
  }
}
