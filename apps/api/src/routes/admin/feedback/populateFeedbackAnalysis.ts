import { AIService } from '@services'
import { database } from '@uni-feedback/db'
import { feedback, feedbackAnalysis } from '@uni-feedback/db/schema'
import { countWords } from '@uni-feedback/utils'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { IRequest } from 'itty-router'
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

  async handle(request: IRequest, env: any, context: any) {
    try {
      // Find all feedback IDs that don't have an analysis record
      const feedbacksWithoutAnalysis = await database()
        .select({
          id: feedback.id,
          comment: feedback.comment
        })
        .from(feedback)
        .leftJoin(
          feedbackAnalysis,
          eq(feedback.id, feedbackAnalysis.feedbackId)
        )
        .where(
          // We only want to analyze feedbacks that have an email
          and(isNull(feedbackAnalysis.feedbackId), isNotNull(feedback.email))
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
      const now = new Date()
      let successCount = 0
      let errorCount = 0

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

      const message =
        errorCount > 0
          ? `Created ${successCount} analysis record${successCount === 1 ? '' : 's'} (${errorCount} failed)`
          : `Successfully created ${successCount} feedback analysis record${successCount === 1 ? '' : 's'} using AI categorization`

      return Response.json({
        created: successCount,
        message
      })
    } catch (error) {
      console.error('Populate feedback analysis error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
