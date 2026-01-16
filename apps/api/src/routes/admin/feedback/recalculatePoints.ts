import { PointService } from '@services'
import { database } from '@uni-feedback/db'
import { feedback, feedbackAnalysis } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, isNotNull } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'

const RecalculatePointsResponseSchema = z.object({
  created: z.number(),
  updated: z.number(),
  unchanged: z.number(),
  message: z.string()
})

export class RecalculatePoints extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Feedback'],
    summary: 'Recalculate points for all feedback using the current formula',
    description:
      'Recalculates points for all approved feedback that has an analysis record and a userId. Creates point entries if they do not exist, updates them if they do. Skips feedback without analysis.',
    responses: {
      '200': {
        description: 'Points recalculated successfully',
        content: {
          'application/json': {
            schema: RecalculatePointsResponseSchema
          }
        }
      },
      '500': {
        description: 'Internal server error',
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
      const pointService = new PointService(env)

      // Find all approved feedback with analysis and a userId
      const feedbackWithAnalysis = await database()
        .select({
          feedbackId: feedback.id,
          userId: feedback.userId,
          analysis: {
            hasTeaching: feedbackAnalysis.hasTeaching,
            hasAssessment: feedbackAnalysis.hasAssessment,
            hasMaterials: feedbackAnalysis.hasMaterials,
            hasTips: feedbackAnalysis.hasTips,
            wordCount: feedbackAnalysis.wordCount
          }
        })
        .from(feedback)
        .innerJoin(
          feedbackAnalysis,
          eq(feedback.id, feedbackAnalysis.feedbackId)
        )
        .where(and(isNotNull(feedback.approvedAt), isNotNull(feedback.userId)))

      if (feedbackWithAnalysis.length === 0) {
        return Response.json({
          created: 0,
          updated: 0,
          unchanged: 0,
          message: 'No approved feedback found with analysis'
        })
      }

      console.log(
        `Recalculating points for ${feedbackWithAnalysis.length} feedback entries...`
      )

      let createdCount = 0
      let updatedCount = 0
      let unchangedCount = 0

      for (const entry of feedbackWithAnalysis) {
        try {
          if (!entry.userId) continue

          // Check existing points
          const existingPoints = await pointService.getPointsForEntry(
            entry.userId,
            'submit_feedback',
            entry.feedbackId
          )

          // Calculate new points
          const newPoints = pointService.calculateFeedbackPoints(entry.analysis)

          if (existingPoints === null) {
            // No point entry exists - create one
            await pointService.awardFeedbackPoints(
              entry.userId,
              entry.feedbackId,
              newPoints
            )
            createdCount++
            console.log(
              `✓ Created points for feedback ${entry.feedbackId}: ${newPoints} points`
            )
          } else if (newPoints !== existingPoints) {
            // Points changed - update
            await pointService.updateFeedbackPoints(
              entry.userId,
              entry.feedbackId,
              entry.analysis
            )
            updatedCount++
            console.log(
              `✓ Updated feedback ${entry.feedbackId}: ${existingPoints} → ${newPoints} points`
            )
          } else {
            unchangedCount++
          }
        } catch (error) {
          console.error(
            `✗ Failed to recalculate for feedback ${entry.feedbackId}:`,
            error
          )
        }
      }

      const parts = []
      if (createdCount > 0) parts.push(`${createdCount} created`)
      if (updatedCount > 0) parts.push(`${updatedCount} updated`)
      if (unchangedCount > 0) parts.push(`${unchangedCount} unchanged`)

      const message =
        parts.length > 0
          ? `Points recalculated: ${parts.join(', ')}`
          : 'No feedback to process'

      return Response.json({
        created: createdCount,
        updated: updatedCount,
        unchanged: unchangedCount,
        message
      })
    } catch (error) {
      console.error('Recalculate points error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
