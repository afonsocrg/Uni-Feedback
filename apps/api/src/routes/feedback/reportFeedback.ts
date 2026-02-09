import { authenticateUser } from '@middleware'
import { sendReportNotification } from '@services'
import { database } from '@uni-feedback/db'
import {
  feedbackFlags,
  feedbackFull,
  REPORT_CATEGORIES,
  type ReportCategory
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import { z } from 'zod'
import { NotFoundError, ValidationError, withErrorHandling } from '../utils'

export class ReportFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Feedback'],
    summary: 'Report feedback',
    description: 'Report a feedback submission for moderation',
    request: {
      params: z.object({ id: z.number() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              category: z.enum(REPORT_CATEGORIES),
              details: z
                .string()
                .min(20, 'Details must be at least 20 characters')
            })
          }
        }
      }
    },
    responses: {
      '201': { description: 'Report submitted successfully' },
      '400': { description: 'Invalid request' },
      '401': { description: 'Not authenticated' },
      '404': { description: 'Feedback not found' }
    }
  }

  async handle(request: IRequest, env: Env, context: any) {
    return withErrorHandling(request, async () => {
      const feedbackId = parseInt(request.params.id)
      const data = await this.getValidatedData<typeof this.schema>()
      const { category, details } = data.body

      // Validate details length
      if (details.length < 20) {
        throw new ValidationError('Details must be at least 20 characters')
      }

      // Authenticate
      const authCheck = await authenticateUser(request, env, context)
      if (authCheck) return authCheck
      const userId = context.user.id

      // Check feedback exists
      const [existingFeedback] = await database()
        .select({ id: feedbackFull.id, comment: feedbackFull.comment })
        .from(feedbackFull)
        .where(eq(feedbackFull.id, feedbackId))
        .limit(1)

      if (!existingFeedback) {
        throw new NotFoundError('Feedback not found')
      }

      // Insert feedback flag
      const [insertedFlag] = await database()
        .insert(feedbackFlags)
        .values({
          userId,
          feedbackId,
          category: category as ReportCategory,
          details
        })
        .returning({ id: feedbackFlags.id })

      // Send Telegram notification (best-effort)
      try {
        await sendReportNotification(env, {
          reportId: insertedFlag.id,
          feedbackId,
          category,
          details,
          reporterId: userId,
          feedbackComment: existingFeedback.comment
        })
      } catch (notifyError) {
        console.error('Failed to send report notification:', notifyError)
      }

      return Response.json(
        {
          message: 'Report submitted successfully'
        },
        { status: 201 }
      )
    })
  }
}
