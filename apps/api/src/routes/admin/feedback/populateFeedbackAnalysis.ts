import { AIService, PointService } from '@services'
import { database } from '@uni-feedback/db'
import { feedback, feedbackAnalysis } from '@uni-feedback/db/schema'
import { countWords } from '@uni-feedback/utils'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { Context } from 'hono'
import { z } from 'zod'

const PopulateAnalysisResponseSchema = z.object({
  created: z.number(),
  message: z.string()
})

export class PopulateFeedbackAnalysis extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Feedback'],
    summary: 'Populate missing feedback analysis records with AI',
    description:
      'Creates feedbackAnalysis records for all feedbacks that do not have one. Uses AI to categorize each feedback comment (teaching, assessment, materials, tips) and calculates word count. This is a long-running operation that processes feedbacks sequentially.',
    responses: {
      '200': {
        description: 'Analysis records created successfully',
        content: {
          'application/json': {
            schema: PopulateAnalysisResponseSchema
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

  async handle(c: Context) {
    const env = c.env as Env
    // Find all feedback IDs that don't have an analysis record
    const feedbacksWithoutAnalysis = await database()
      .select({
        id: feedback.id,
        userId: feedback.userId,
        comment: feedback.comment
      })
      .from(feedback)
      .leftJoin(feedbackAnalysis, eq(feedback.id, feedbackAnalysis.feedbackId))
      .where(
        // We only want to analyze feedbacks that have a userId (for points)
        and(isNull(feedbackAnalysis.feedbackId), isNotNull(feedback.userId))
      )

    if (feedbacksWithoutAnalysis.length === 0) {
      return Response.json({
        created: 0,
        message: 'All feedbacks already have analysis records'
      })
    }

    console.log(
      `Processing ${feedbacksWithoutAnalysis.length} feedbacks for AI categorization...`
    )

    // Initialize AI service
    const aiService = new AIService(env)
    const pointService = new PointService(env)
    const now = new Date()
    let successCount = 0
    let errorCount = 0
    // Backfilling an analysis can turn a feedback into a "perfect" one, which can
    // push a user over the perfect-feedback bonus threshold. The bonus is only
    // ever awarded reactively, so without reconciling here those users would
    // silently never receive it. Collected and reconciled once per user at the
    // end, since the threshold depends on the user's whole set, not one row.
    const touchedUserIds = new Set<number>()

    // Process each feedback one by one with AI categorization
    for (const fb of feedbacksWithoutAnalysis) {
      try {
        let analysis
        if (fb.comment) {
          try {
            // Use AI to categorize the feedback
            const categories = await aiService.categorizeFeedback(fb.comment)
            const wordCount = countWords(fb.comment)
            analysis = { ...categories, wordCount }
          } catch (aiError) {
            console.warn(
              `AI categorization failed for feedback ${fb.id}, using conservative defaults:`,
              aiError
            )
            // Fallback to conservative defaults on AI error
            analysis = {
              hasTeaching: false,
              hasAssessment: false,
              hasMaterials: false,
              hasTips: false,
              wordCount: countWords(fb.comment)
            }
          }
        } else {
          // No comment - use defaults
          analysis = {
            hasTeaching: false,
            hasAssessment: false,
            hasMaterials: false,
            hasTips: false,
            wordCount: 0
          }
        }

        // Insert analysis record
        await database()
          .insert(feedbackAnalysis)
          .values({
            feedbackId: fb.id,
            ...analysis,
            createdAt: now,
            updatedAt: now,
            reviewedAt: null // Not yet reviewed by a moderator
          })

        if (fb.userId !== null) {
          touchedUserIds.add(fb.userId)
        }

        successCount++
        console.log(
          `✓ Processed feedback ${fb.id} (${successCount}/${feedbacksWithoutAnalysis.length})`
        )
      } catch (error) {
        errorCount++
        console.error(`✗ Failed to process feedback ${fb.id}:`, error)
        // Continue processing other feedbacks
      }
    }

    // Reconcile the perfect-feedback bonus for every user whose analysis changed.
    // Idempotent per user, so a failure here never double-awards on a re-run.
    let bonusReconciled = 0
    for (const userId of touchedUserIds) {
      try {
        await pointService.reconcilePerfectFeedbackBonus(userId)
        bonusReconciled++
      } catch (bonusError) {
        console.error(
          'Failed to reconcile perfect-feedback bonus for user:',
          userId,
          bonusError
        )
        // Continue with the other users
      }
    }

    const message =
      errorCount > 0
        ? `Created ${successCount} analysis record${successCount === 1 ? '' : 's'} (${errorCount} failed), reconciled bonuses for ${bonusReconciled} user${bonusReconciled === 1 ? '' : 's'}`
        : `Successfully created ${successCount} feedback analysis record${successCount === 1 ? '' : 's'} using AI categorization, reconciled bonuses for ${bonusReconciled} user${bonusReconciled === 1 ? '' : 's'}`

    return Response.json({
      created: successCount,
      message
    })
  }
}
