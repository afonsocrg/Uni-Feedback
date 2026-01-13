import { authenticateUser } from '@middleware'
import { AIService, PointService } from '@services'
import { database } from '@uni-feedback/db'
import {
  feedback,
  feedbackAnalysis,
  feedbackFull
} from '@uni-feedback/db/schema'
import { countWords } from '@uni-feedback/utils'
import { contentJson, OpenAPIRoute } from 'chanfana'
import { and, desc, eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { UnauthorizedError, withErrorHandling } from '../utils'

const EditFeedbackRequestSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    workloadRating: z.number().int().min(1).max(5),
    comment: z.string().optional()
  })
  .strict()

export class EditFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Feedback'],
    summary: 'Edit user feedback',
    description: 'Edit your own feedback submission',
    request: {
      params: z.object({
        id: z.coerce.number().int().positive().max(2147483647)
      }),
      body: contentJson(EditFeedbackRequestSchema)
    },
    responses: {
      '200': { description: 'Feedback updated' },
      '400': { description: 'Invalid feedback ID' },
      '403': { description: 'Not authorized' },
      '404': { description: 'Feedback not found' }
    }
  }

  async handle(request: IRequest, env: Env, context: any) {
    return withErrorHandling(request, async () => {
      const { params, body } = await this.getValidatedData<typeof this.schema>()
      const feedbackId = params.id

      // Authenticate
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck
      const userId = context.user.id

      // Fetch existing feedback
      const [existingFeedback] = await database()
        .select()
        .from(feedback)
        .where(and(eq(feedback.id, feedbackId), eq(feedback.userId, userId)))
        .orderBy(desc(feedback.updatedAt))
        .limit(1)

      // Check ownership
      if (!existingFeedback) {
        throw new UnauthorizedError('You can only edit your own feedback')
      }

      const newComment = body.comment?.trim() || null

      // Check if identical
      const isIdentical =
        existingFeedback.rating === body.rating &&
        existingFeedback.workloadRating === body.workloadRating &&
        existingFeedback.comment === newComment

      if (isIdentical) {
        const pointService = new PointService(env)
        const currentPoints = await pointService.getPointsForEntry(
          userId,
          'submit_feedback',
          feedbackId
        )

        // Fetch analysis
        const [analysis] = await database()
          .select()
          .from(feedbackAnalysis)
          .where(eq(feedbackAnalysis.feedbackId, feedbackId))
          .limit(1)

        return Response.json({
          message: 'No changes detected',
          feedback: existingFeedback,
          analysis: analysis || null,
          points: currentPoints || 0
        })
      }

      // Handle comment changes
      const commentChanged = existingFeedback.comment !== newComment
      let newPoints = 0

      if (commentChanged) {
        const pointService = new PointService(env)

        // Analyze new comment
        let newAnalysis
        if (newComment) {
          const aiService = new AIService(env)
          try {
            const categories = await aiService.categorizeFeedback(newComment)
            newAnalysis = { ...categories, wordCount: countWords(newComment) }
          } catch (aiError) {
            console.warn(
              'AI categorization failed, using conservative defaults:',
              aiError
            )
            newAnalysis = {
              hasTeaching: false,
              hasAssessment: false,
              hasMaterials: false,
              hasTips: false,
              wordCount: countWords(newComment)
            }
          }
        } else {
          newAnalysis = {
            hasTeaching: false,
            hasAssessment: false,
            hasMaterials: false,
            hasTips: false,
            wordCount: 0
          }
        }

        // Update analysis (reset reviewedAt)
        await database()
          .update(feedbackAnalysis)
          .set({ ...newAnalysis, reviewedAt: null })
          .where(eq(feedbackAnalysis.feedbackId, feedbackId))

        // Update points
        newPoints = await pointService.updateFeedbackPoints(
          userId,
          feedbackId,
          newAnalysis
        )
      } else {
        // Get existing points
        const pointService = new PointService(env)
        newPoints =
          (await pointService.getPointsForEntry(
            userId,
            'submit_feedback',
            feedbackId
          )) || 0
      }

      // Update feedback (preserve approvedAt)
      await database()
        .update(feedbackFull)
        .set({
          rating: body.rating,
          workloadRating: body.workloadRating,
          comment: newComment,
          updatedAt: new Date()
        })
        .where(eq(feedbackFull.id, feedbackId))

      // Fetch updated feedback
      const [updatedFeedback] = await database()
        .select()
        .from(feedback)
        .where(eq(feedback.id, feedbackId))
        .limit(1)

      // Fetch updated analysis
      const [analysis] = await database()
        .select()
        .from(feedbackAnalysis)
        .where(eq(feedbackAnalysis.feedbackId, feedbackId))
        .limit(1)

      return Response.json({
        message: 'Feedback updated successfully',
        feedback: updatedFeedback,
        analysis: analysis || null,
        points: newPoints
      })
    })
  }
}
