import { authenticateUser } from '@middleware'
import { PointService } from '@services'
import { database } from '@uni-feedback/db'
import { feedback, feedbackFull } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { UnauthorizedError, withErrorHandling } from '../utils'

export class DeleteFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Feedback'],
    summary: 'Delete user feedback',
    description:
      'Soft delete your own feedback submission and remove associated points',
    request: {
      params: z.object({ id: z.number() })
    },
    responses: {
      '200': { description: 'Feedback deleted successfully' },
      '401': { description: 'Not authenticated' },
      '403': { description: 'Not authorized to delete this feedback' }
    }
  }

  async handle(request: IRequest, env: Env, context: any) {
    return withErrorHandling(request, async () => {
      const feedbackId = parseInt(request.params.id)

      // Authenticate
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck
      const userId = context.user.id

      // Fetch existing feedback from the full table to check deletedAt
      const [existingFeedback] = await database()
        .select()
        .from(feedbackFull)
        .where(
          and(eq(feedbackFull.id, feedbackId), eq(feedbackFull.userId, userId))
        )
        .limit(1)

      // Check ownership - if not found, either doesn't exist or not owned by user
      if (!existingFeedback) {
        throw new UnauthorizedError(
          'You do not have permission to delete this feedback'
        )
      }

      // Check if already deleted
      if (existingFeedback.deletedAt) {
        return Response.json({
          message: 'Feedback already deleted'
        })
      }

      // Soft delete the feedback by setting deletedAt
      await database()
        .update(feedbackFull)
        .set({ deletedAt: new Date() })
        .where(eq(feedbackFull.id, feedbackId))

      // Remove points associated with this feedback (best-effort)
      try {
        const pointService = new PointService(env)
        await pointService.zeroOutFeedbackPoints(
          userId,
          feedbackId,
          'Feedback deleted by user'
        )
      } catch (pointError) {
        console.error(
          `Failed to remove points for deleted feedback ${feedbackId}:`,
          pointError
        )
        // Continue - feedback was deleted, points can be fixed manually if needed
      }

      return Response.json({
        message: 'Feedback deleted successfully'
      })
    })
  }
}
