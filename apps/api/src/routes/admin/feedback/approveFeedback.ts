import { PointService } from '@services'
import { database } from '@uni-feedback/db'
import { feedback, feedbackFull } from '@uni-feedback/db/schema'
import { notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const ApproveFeedbackParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
})

const ApproveFeedbackResponseSchema = z.object({
  id: z.number(),
  approved: z.boolean(),
  approvedAt: z.string(),
  message: z.string()
})

export class ApproveFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Feedback'],
    summary: 'Approve feedback',
    description: 'Approve a feedback entry and restore points for the user if applicable',
    request: {
      params: ApproveFeedbackParamsSchema
    },
    responses: {
      '200': {
        description: 'Feedback approved successfully or already approved',
        content: {
          'application/json': {
            schema: ApproveFeedbackResponseSchema
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
      const wasAlreadyApproved = feedbackData.approvedAt !== null

      // Idempotent: if already approved, return success without changes
      if (wasAlreadyApproved) {
        return Response.json({
          id: feedbackId,
          approved: true,
          approvedAt: feedbackData.approvedAt!.toISOString(),
          message: 'Feedback is already approved'
        })
      }

      // Update approval status
      const approvalDate = new Date()
      await database()
        .update(feedbackFull)
        .set({ approvedAt: approvalDate })
        .where(eq(feedbackFull.id, feedbackId))

      // Handle point restoration for authenticated users (best-effort)
      const userId = feedbackData.userId
      if (userId) {
        try {
          const pointService = new PointService(env)
          await pointService.restoreFeedbackPoints(userId, feedbackId)
        } catch (pointError) {
          console.error(
            `Failed to restore points for feedback ${feedbackId}:`,
            pointError
          )
          // Continue - feedback approval succeeded, points can be fixed manually
        }
      } else {
        console.log(
          `Feedback ${feedbackId} is anonymous - skipping point restoration`
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
            oldValue: false,
            newValue: true
          }
        ]
      })

      return Response.json({
        id: feedbackId,
        approved: true,
        approvedAt: approvalDate.toISOString(),
        message: 'Feedback approved successfully'
      })
    } catch (error) {
      console.error('Approve feedback error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
