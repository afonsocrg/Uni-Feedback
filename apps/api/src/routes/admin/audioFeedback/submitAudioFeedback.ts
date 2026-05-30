import { requireAdmin } from '@middleware'
import { StatsService } from '@services'
import { database } from '@uni-feedback/db'
import { audioRecordings, feedbackFull } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'
import { BadRequestError, NotFoundError } from '../../utils'

const SubmitAudioFeedbackBodySchema = z.object({
  audioId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  schoolYear: z.number().int(),
  rating: z.number().int().min(1).max(5),
  workloadRating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  email: z.string().email(),
  consentGiven: z.literal(true)
})

export class SubmitAudioFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Audio Feedback'],
    summary: 'Submit in-person audio feedback',
    description:
      'Inserts a feedback_full record (immediately approved) and links it to the audio_recordings row created during processing.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: SubmitAudioFeedbackBodySchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Feedback submitted successfully',
        content: {
          'application/json': {
            schema: z.object({ feedbackId: z.number() })
          }
        }
      },
      '400': {
        description: 'Validation error or consent not given',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      },
      '404': {
        description: 'Audio recording not found',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      }
    }
  }

  async handle(c: Context) {
    await requireAdmin(c)
    const { body } = await this.getValidatedData<typeof this.schema>()

    const {
      audioId,
      courseId,
      schoolYear,
      rating,
      workloadRating,
      comment,
      email
    } = body

    // Verify the audio recording exists and belongs to this course
    const existingAudio = await database()
      .select({ id: audioRecordings.id, courseId: audioRecordings.courseId })
      .from(audioRecordings)
      .where(eq(audioRecordings.id, audioId))
      .limit(1)

    if (!existingAudio.length) {
      throw new NotFoundError('Audio recording not found')
    }

    if (existingAudio[0].courseId !== courseId) {
      throw new BadRequestError(
        'Audio recording does not belong to the given course'
      )
    }

    const now = new Date()
    const commentText = comment ?? null

    const feedbackId = await database().transaction(async (tx) => {
      const [inserted] = await tx
        .insert(feedbackFull)
        .values({
          userId: null,
          email,
          courseId,
          schoolYear,
          rating,
          workloadRating,
          comment: commentText,
          originalComment: commentText,
          approvedAt: now
        })
        .returning({ id: feedbackFull.id })

      await tx
        .update(audioRecordings)
        .set({
          feedbackId: inserted.id,
          consentGiven: true,
          consentGivenAt: now
        })
        .where(eq(audioRecordings.id, audioId))

      return inserted.id
    })

    // Update course stats (best-effort)
    try {
      const statsService = new StatsService()
      await statsService.onFeedbackApproved(courseId)
    } catch (statsError) {
      console.error(
        'Failed to update stats after audio feedback submit:',
        statsError
      )
    }

    return Response.json({ feedbackId })
  }
}
