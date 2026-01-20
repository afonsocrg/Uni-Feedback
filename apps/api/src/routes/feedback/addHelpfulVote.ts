import { authenticateUser } from '@middleware'
import { database } from '@uni-feedback/db'
import { feedbackFull, helpfulVotes } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { NotFoundError, withErrorHandling } from '../utils'

export class AddHelpfulVote extends OpenAPIRoute {
  schema = {
    tags: ['Feedback'],
    summary: 'Mark feedback as helpful',
    description: 'Add a helpful vote to a feedback submission',
    request: {
      params: z.object({ id: z.number() })
    },
    responses: {
      '200': { description: 'Vote recorded successfully' },
      '401': { description: 'Not authenticated' },
      '404': { description: 'Feedback not found' }
    }
  }

  async handle(request: IRequest, env: Env, context: any) {
    return withErrorHandling(request, async () => {
      const feedbackId = parseInt(request.params.id)

      // Authenticate
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck
      const userId = context.user.id

      // Check feedback exists
      const [existingFeedback] = await database()
        .select({ id: feedbackFull.id })
        .from(feedbackFull)
        .where(eq(feedbackFull.id, feedbackId))
        .limit(1)

      if (!existingFeedback) {
        throw new NotFoundError('Feedback not found')
      }

      // Check if already voted (idempotent)
      const [existingVote] = await database()
        .select()
        .from(helpfulVotes)
        .where(
          and(
            eq(helpfulVotes.userId, userId),
            eq(helpfulVotes.feedbackId, feedbackId)
          )
        )
        .limit(1)

      if (existingVote) {
        return Response.json({
          message: 'Already voted as helpful'
        })
      }

      // Insert vote
      await database().insert(helpfulVotes).values({
        userId,
        feedbackId
      })

      return Response.json({
        message: 'Marked as helpful'
      })
    })
  }
}
