import { requireAdmin } from '@middleware'
import { StatsService } from '@services'
import { database } from '@uni-feedback/db'
import { feedback, feedbackFull } from '@uni-feedback/db/schema'
import { detectChanges, notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'
import { BadRequestError, NotFoundError } from '../../utils'

const FeedbackUpdateParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
})

const FeedbackUpdateBodySchema = z.object({
  schoolYear: z.number().nullable().optional(),
  rating: z.number().min(1).max(5).optional(),
  workloadRating: z.number().min(1).max(5).nullable().optional(),
  comment: z.string().nullable().optional()
})

const FeedbackUpdateResponseSchema = z.object({
  id: z.number(),
  schoolYear: z.number().nullable(),
  rating: z.number(),
  workloadRating: z.number().nullable(),
  comment: z.string().nullable(),
  approved: z.boolean(),
  updatedAt: z.string(),
  message: z.string()
})

export class UpdateFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Feedback'],
    summary: 'Update feedback information',
    description: 'Update specific fields of a feedback entry',
    request: {
      params: FeedbackUpdateParamsSchema,
      body: {
        content: {
          'application/json': {
            schema: FeedbackUpdateBodySchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Feedback updated successfully',
        content: {
          'application/json': {
            schema: FeedbackUpdateResponseSchema
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
        description: 'Invalid request data',
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

  async handle(c: Context) {
    const env = c.env
    const authContext = await requireAdmin(c)
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    const { id: feedbackId } = params
    const updates = body

    if (!feedbackId || isNaN(feedbackId)) {
      throw new BadRequestError('Invalid feedback ID')
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('No update fields provided')
    }

    // Check if feedback exists
    const existingFeedback = await database()
      .select()
      .from(feedback)
      .where(eq(feedback.id, feedbackId))
      .limit(1)

    if (!existingFeedback.length) {
      throw new NotFoundError('Feedback not found')
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (updates.schoolYear !== undefined) {
      updateData.schoolYear = updates.schoolYear
    }

    if (updates.rating !== undefined) {
      updateData.rating = updates.rating
    }

    if (updates.workloadRating !== undefined) {
      updateData.workloadRating = updates.workloadRating
    }

    if (updates.comment !== undefined) {
      updateData.comment = updates.comment
    }

    // Detect changes for notification (compare with original feedback fields)
    const originalData = {
      schoolYear: existingFeedback[0].schoolYear,
      rating: existingFeedback[0].rating,
      workloadRating: existingFeedback[0].workloadRating,
      comment: existingFeedback[0].comment
    }
    const newData = {
      ...originalData,
      ...updates
    }
    const changes = detectChanges(originalData, newData, [
      'schoolYear',
      'rating',
      'workloadRating',
      'comment'
    ])

    // Perform update
    await database()
      .update(feedbackFull)
      .set(updateData)
      .where(eq(feedbackFull.id, feedbackId))

    // Get updated feedback
    const updatedFeedback = await database()
      .select()
      .from(feedback)
      .where(eq(feedback.id, feedbackId))
      .limit(1)

    const fb = updatedFeedback[0]

    // Send notification if changes were made
    if (changes.length > 0) {
      await notifyAdminChange({
        env,
        user: authContext.user,
        resourceType: 'feedback',
        resourceId: feedbackId,
        resourceName: `Feedback #${feedbackId}`,
        action: 'updated',
        changes
      })
    }

    // Update stats if rating or workload changed and feedback is approved
    const ratingChanged =
      updates.rating !== undefined || updates.workloadRating !== undefined
    if (ratingChanged && fb.approvedAt !== null) {
      try {
        const statsService = new StatsService()
        await statsService.onFeedbackEdited(fb.courseId)
      } catch (statsError) {
        console.error(
          'Failed to update stats after admin feedback update:',
          statsError
        )
      }
    }

    const response = {
      id: fb.id,
      schoolYear: fb.schoolYear,
      rating: fb.rating,
      workloadRating: fb.workloadRating,
      comment: fb.comment,
      approved: fb.approvedAt !== null,
      updatedAt: fb.updatedAt,
      message: 'Feedback updated successfully'
    }

    return Response.json(response)
  }
}
