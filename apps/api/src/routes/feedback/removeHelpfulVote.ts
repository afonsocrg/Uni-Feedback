import { authenticateUser } from '@middleware'
import { database } from '@uni-feedback/db'
import { helpfulVotes } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { withErrorHandling } from '../utils'

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

  async handle(request: IRequest, env: Env, context: any) {
    return withErrorHandling(request, async () => {
      const feedbackId = parseInt(request.params.id)

      // Authenticate
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck
      const userId = context.user.id

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
    })
  }
}
