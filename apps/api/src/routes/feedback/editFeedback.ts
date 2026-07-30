import { requireAuth } from '@middleware'
import { AIService, PointService, StatsService } from '@services'
import { sendFeedbackEdited } from '@services/telegram'
import { database } from '@uni-feedback/db'
import {
  courses,
  degrees,
  faculties,
  feedback,
  feedbackAnalysis,
  feedbackFull
} from '@uni-feedback/db/schema'
import { countWords } from '@uni-feedback/utils'
import { contentJson, OpenAPIRoute } from 'chanfana'
import { and, desc, eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'
import { ForbiddenError } from '../utils'

const EditFeedbackRequestSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    workloadRating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    schoolYear: z.number().int().min(2000).max(2100).optional()
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

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const env = c.env as Env
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    const feedbackId = params.id

    // Authenticate
    const userId = authContext.user.id

    // Fetch existing feedback
    const [existingFeedback] = await database()
      .select()
      .from(feedback)
      .where(and(eq(feedback.id, feedbackId), eq(feedback.userId, userId)))
      .orderBy(desc(feedback.updatedAt))
      .limit(1)

    // Check ownership
    if (!existingFeedback) {
      throw new ForbiddenError('You can only edit your own feedback')
    }

    const newComment = body.comment?.trim() || null

    // Check if identical
    const newSchoolYear = body.schoolYear ?? existingFeedback.schoolYear
    const isIdentical =
      existingFeedback.rating === body.rating &&
      existingFeedback.workloadRating === body.workloadRating &&
      existingFeedback.comment === newComment &&
      existingFeedback.schoolYear === newSchoolYear

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
    const pointService = new PointService(env)
    const oldPoints =
      (await pointService.getPointsForEntry(
        userId,
        'submit_feedback',
        feedbackId
      )) || 0
    let newPoints = 0

    if (commentChanged) {
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
      // Keep existing points
      newPoints = oldPoints
    }

    // Update feedback (preserve approvedAt)
    await database()
      .update(feedbackFull)
      .set({
        rating: body.rating,
        workloadRating: body.workloadRating,
        comment: newComment,
        schoolYear: newSchoolYear,
        updatedAt: new Date()
      })
      .where(eq(feedbackFull.id, feedbackId))

    // Reconcile the perfect-feedback giveaway bonus (best-effort).
    // A comment or school-year change can move the user above/below the
    // threshold, so re-check after every edit.
    try {
      await new PointService(env).reconcilePerfectFeedbackBonus(userId)
    } catch (bonusError) {
      console.error(
        `Failed to reconcile perfect-feedback bonus for user ${userId}:`,
        bonusError
      )
    }

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

    // Update stats if feedback is approved and rating/workload changed
    const ratingChanged =
      existingFeedback.rating !== body.rating ||
      existingFeedback.workloadRating !== body.workloadRating
    if (ratingChanged && updatedFeedback.approvedAt !== null) {
      try {
        const statsService = new StatsService()
        await statsService.onFeedbackEdited(updatedFeedback.courseId)
      } catch (statsError) {
        console.error('Failed to update stats after feedback edit:', statsError)
      }
    }

    // Notify on Telegram (best-effort)
    try {
      const [context] = await database()
        .select({
          courseId: courses.id,
          courseName: courses.name,
          degreeName: degrees.name,
          facultyShortName: faculties.shortName
        })
        .from(courses)
        .innerJoin(degrees, eq(courses.degreeId, degrees.id))
        .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(eq(courses.id, updatedFeedback.courseId))
        .limit(1)

      await sendFeedbackEdited(env, {
        id: feedbackId,
        email: authContext.user.email,
        course: {
          id: updatedFeedback.courseId,
          name: context?.courseName ?? `Course #${updatedFeedback.courseId}`
        },
        degree: { name: context?.degreeName ?? 'unknown degree' },
        faculty: { shortName: context?.facultyShortName ?? 'unknown faculty' },
        before: {
          schoolYear: existingFeedback.schoolYear,
          rating: existingFeedback.rating,
          workloadRating: existingFeedback.workloadRating,
          comment: existingFeedback.comment,
          points: oldPoints
        },
        after: {
          schoolYear: updatedFeedback.schoolYear,
          rating: updatedFeedback.rating,
          workloadRating: updatedFeedback.workloadRating,
          comment: updatedFeedback.comment,
          points: newPoints
        }
      })
    } catch (notificationError) {
      console.error(
        'Failed to send Telegram notification after feedback edit:',
        notificationError
      )
    }

    return Response.json({
      message: 'Feedback updated successfully',
      feedback: updatedFeedback,
      analysis: analysis || null,
      points: newPoints
    })
  }
}
