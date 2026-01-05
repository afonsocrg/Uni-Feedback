import { PointService } from '@services'
import { sendAnalysisUpdateNotification } from '@services/telegram'
import { database } from '@uni-feedback/db'
import { feedback, feedbackAnalysis } from '@uni-feedback/db/schema'
import { countWords } from '@uni-feedback/utils'
import { notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const UpdateAnalysisParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
})

const UpdateAnalysisBodySchema = z.object({
  hasTeaching: z.boolean(),
  hasAssessment: z.boolean(),
  hasMaterials: z.boolean(),
  hasTips: z.boolean()
})

const UpdateAnalysisResponseSchema = z.object({
  feedbackId: z.number(),
  analysis: z.object({
    hasTeaching: z.boolean(),
    hasAssessment: z.boolean(),
    hasMaterials: z.boolean(),
    hasTips: z.boolean(),
    wordCount: z.number()
  }),
  pointsAwarded: z.number().nullable(),
  message: z.string()
})

export class UpdateFeedbackAnalysis extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Feedback'],
    summary: 'Update or create feedback analysis',
    description:
      'Update analysis for a feedback entry and recalculate points if applicable. Word count is automatically calculated from the feedback comment.',
    request: {
      params: UpdateAnalysisParamsSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateAnalysisBodySchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Analysis updated successfully',
        content: {
          'application/json': {
            schema: UpdateAnalysisResponseSchema
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
        description: 'Invalid feedback ID or request body',
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
      const { params, body } = await this.getValidatedData<typeof this.schema>()
      const { id: feedbackId } = params
      const { hasTeaching, hasAssessment, hasMaterials, hasTips } = body

      if (!feedbackId || isNaN(feedbackId)) {
        return Response.json({ error: 'Invalid feedback ID' }, { status: 400 })
      }

      // Get feedback data
      const existingFeedback = await database()
        .select({
          id: feedback.id,
          userId: feedback.userId,
          comment: feedback.comment,
          approvedAt: feedback.approvedAt
        })
        .from(feedback)
        .where(eq(feedback.id, feedbackId))
        .limit(1)

      if (!existingFeedback.length) {
        return Response.json({ error: 'Feedback not found' }, { status: 404 })
      }

      const feedbackData = existingFeedback[0]

      // Auto-calculate word count from comment
      const wordCount = countWords(feedbackData.comment)

      // Get old analysis if it exists
      const oldAnalysis = await database()
        .select()
        .from(feedbackAnalysis)
        .where(eq(feedbackAnalysis.feedbackId, feedbackId))
        .limit(1)

      const now = new Date()
      const analysisData = {
        feedbackId,
        hasTeaching,
        hasAssessment,
        hasMaterials,
        hasTips,
        wordCount,
        updatedAt: now,
        reviewedAt: undefined as Date | undefined // to be set conditionally
      }

      // Update or insert analysis
      if (oldAnalysis.length > 0) {
        // If this is the first time a moderator reviews this analysis, set reviewedAt
        if (oldAnalysis[0].reviewedAt === null) {
          analysisData.reviewedAt = now
        }

        await database()
          .update(feedbackAnalysis)
          .set(analysisData)
          .where(eq(feedbackAnalysis.feedbackId, feedbackId))
      } else {
        // New analysis created by moderator - set reviewedAt immediately
        analysisData.reviewedAt = now
        await database().insert(feedbackAnalysis).values(analysisData)
      }

      // Recalculate and update points if feedback is approved and has userId
      let pointsAwarded: number | null = null
      const pointService = new PointService(env)
      const oldPoints = await pointService.getPointsForEntry(
        feedbackData.userId,
        'submit_feedback',
        feedbackId
      )

      if (feedbackData.approvedAt && feedbackData.userId) {
        try {
          pointsAwarded = await pointService.updateFeedbackPoints(
            feedbackData.userId,
            feedbackId,
            analysisData
          )
        } catch (pointError) {
          console.error(
            `Failed to update points for feedback ${feedbackId}:`,
            pointError
          )
          // Continue - analysis update succeeded, points can be fixed manually
        }
      }

      // Send Telegram notification
      try {
        await sendAnalysisUpdateNotification({
          env,
          adminEmail: context.user?.email || 'Unknown admin',
          feedbackId,
          oldAnalysis: oldAnalysis[0] || null,
          newAnalysis: analysisData,
          oldPoints: oldPoints,
          newPoints: pointsAwarded,
          dashboardLink: `${env.DASHBOARD_URL || 'http://localhost:5174'}/feedback/${feedbackId}`
        })
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError)
        // Continue - don't fail the request if notification fails
      }

      // Also send admin change notification
      const changes = []
      if (oldAnalysis.length > 0) {
        const old = oldAnalysis[0]
        if (old.hasTeaching !== hasTeaching) {
          changes.push({
            field: 'hasTeaching',
            oldValue: old.hasTeaching,
            newValue: hasTeaching
          })
        }
        if (old.hasAssessment !== hasAssessment) {
          changes.push({
            field: 'hasAssessment',
            oldValue: old.hasAssessment,
            newValue: hasAssessment
          })
        }
        if (old.hasMaterials !== hasMaterials) {
          changes.push({
            field: 'hasMaterials',
            oldValue: old.hasMaterials,
            newValue: hasMaterials
          })
        }
        if (old.hasTips !== hasTips) {
          changes.push({
            field: 'hasTips',
            oldValue: old.hasTips,
            newValue: hasTips
          })
        }
      }

      if (changes.length > 0) {
        await notifyAdminChange({
          env,
          user: context.user,
          resourceType: 'feedback_analysis',
          resourceId: feedbackId,
          resourceName: `Feedback #${feedbackId} Analysis`,
          action: 'updated',
          changes
        })
      }

      return Response.json({
        feedbackId,
        analysis: {
          hasTeaching,
          hasAssessment,
          hasMaterials,
          hasTips,
          wordCount
        },
        pointsAwarded,
        message:
          oldAnalysis.length > 0
            ? 'Analysis updated successfully'
            : 'Analysis created successfully'
      })
    } catch (error) {
      console.error('Update feedback analysis error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
