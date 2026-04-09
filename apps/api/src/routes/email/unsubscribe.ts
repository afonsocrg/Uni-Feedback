import { NotFoundError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import { emailPreferences } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

export class Unsubscribe extends OpenAPIRoute {
  schema = {
    tags: ['Email'],
    summary: 'Unsubscribe from reminder emails',
    request: {
      query: z.object({
        token: z.string().min(1)
      })
    },
    responses: {
      '200': {
        description: 'Successfully unsubscribed',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string()
            })
          }
        }
      },
      '400': {
        description: 'Invalid or missing token',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      '404': {
        description: 'Token not found',
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
    const data = await this.getValidatedData<typeof this.schema>()
    const { token } = data.query

    // Find email preferences by token
    const [preferences] = await database()
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.unsubscribeToken, token))
      .limit(1)

    if (!preferences) {
      throw new NotFoundError(
        'Invalid unsubscribe token. Please contact support@uni-feedback.com if you need help unsubscribing.'
      )
    }

    // Check if already unsubscribed
    if (!preferences.subscribedReminders) {
      return Response.json({
        message: 'You are already unsubscribed from reminder emails.'
      })
    }

    // Update preferences to unsubscribe
    await database()
      .update(emailPreferences)
      .set({
        subscribedReminders: false,
        unsubscribedAt: new Date()
      })
      .where(eq(emailPreferences.id, preferences.id))

    return Response.json({
      message: 'You have been successfully unsubscribed from reminder emails.'
    })
  }
}
