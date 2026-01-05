import { PointService } from '@services'
import { database } from '@uni-feedback/db'
import { feedback } from '@uni-feedback/db/schema'
import { notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const UnapproveFeedbackParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
})

const UnapproveFeedbackResponseSchema = z.object({
  id: z.number(),
  approved: z.boolean(),
  approvedAt: z.null(),
  message: z.string()
})

export class UnapproveFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Feedback'],
    summary: 'Unapprove feedback',
    description: 'Unapprove a feedback entry and zero out points for the user if applicable',
    request: {
      params: UnapproveFeedbackParamsSchema
    },
    responses: {
      '200': {
        description: 'Feedback unapproved successfully or already unapproved',
        content: {
          'application/json': {
            schema: UnapproveFeedbackResponseSchema
          }
        }
      },
      '404': {
        description: 'Feedback not found',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      '400': {
        description: 'Invalid feedback ID',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    try {
      const { params } = await this.getValidatedData<typeof this.schema>()
      const { id: feedbackId } = params

      if (!feedbackId || isNaN(feedbackId)) {
        return Response.json({ error: 'Invalid feedback ID' }, { status: 400 })
      }

      // Get feedback data
      const existingFeedback = await database()
        .select({
          id: feedback.id,
          userId: feedback.userId,
          approvedAt: feedback.approvedAt
        })
        .from(feedback)
        .where(eq(feedback.id, feedbackId))
        .limit(1)

      if (!existingFeedback.length) {
        return Response.json({ error: 'Feedback not found' }, { status: 404 })
      }

      const feedbackData = existingFeedback[0]
      const wasAlreadyUnapproved = feedbackData.approvedAt === null

      // Idempotent: if already unapproved, return success without changes
      if (wasAlreadyUnapproved) {
        return Response.json({
          id: feedbackId,
          approved: false,
          approvedAt: null,
          message: 'Feedback is already unapproved'
        })
      }

      // Update approval status
      await database()
        .update(feedback)
        .set({ approvedAt: null })
        .where(eq(feedback.id, feedbackId))

      // Handle point zeroing for authenticated users (best-effort)
      const userId = feedbackData.userId
      if (userId) {
        try {
          const pointService = new PointService(env)
          await pointService.zeroOutFeedbackPoints(
            userId,
            feedbackId,
            'Feedback unapproved by admin'
          )
        } catch (pointError) {
          console.error(
            `Failed to zero out points for feedback ${feedbackId}:`,
            pointError
          )
          // Continue - feedback unapproval succeeded, points can be fixed manually
        }
      } else {
        console.log(
          `Feedback ${feedbackId} is anonymous - skipping point zeroing`
        )
      }

      // Send notification
      await notifyAdminChange({
        env,
        user: context.user,
        resourceType: 'feedback',
        resourceId: feedbackId,
        resourceName: `Feedback #${feedbackId}`,
        action: 'updated',
        changes: [
          {
            field: 'approved',
            oldValue: true,
            newValue: false
          }
        ]
      })

      return Response.json({
        id: feedbackId,
        approved: false,
        approvedAt: null,
        message: 'Feedback unapproved successfully'
      })
    } catch (error) {
      console.error('Unapprove feedback error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
