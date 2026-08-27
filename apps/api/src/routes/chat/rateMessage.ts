import { requireAuth } from '@middleware'
import { database } from '@uni-feedback/db'
import {
  chatMessageFeedback,
  chatMessages,
  chats
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'
import { NotFoundError } from '../utils'

/**
 * Rate one answer.
 *
 * Per message, not per chat: a chat is a sequence of turns of varying quality,
 * so "this chat was bad" is not actionable, while "this answer was bad" points
 * at one message, one set of tool calls and one set of retrieved entities.
 *
 * This is the cheapest detector we have for the failure that matters most here,
 * which is a confident, well-formatted, wrong answer. Those are invisible to
 * cost dashboards and error rates.
 */
export class RateChatMessage extends OpenAPIRoute {
  schema = {
    tags: ['Chat'],
    summary: 'Rate an assistant answer',
    request: {
      params: z.object({ id: z.coerce.number() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              rating: z.enum(['helpful', 'not_helpful']),
              // Only ever asked for after a thumbs down, and always optional:
              // asking everyone to write gets no data, asking the annoyed
              // minority gets the useful data.
              comment: z.string().max(1000).optional()
            })
          }
        }
      }
    },
    responses: {
      '200': { description: 'Rating saved' },
      '401': { description: 'Not authenticated' },
      '404': { description: 'Message not found' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    const userId = authContext.user.id

    // Join through chats so a user can only rate answers in their own
    // conversations. A message in someone else's chat is a 404, not a 403.
    const [message] = await database()
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .innerJoin(chats, eq(chatMessages.chatId, chats.id))
      .where(
        and(
          eq(chatMessages.id, params.id),
          eq(chatMessages.role, 'assistant'),
          eq(chats.userId, userId)
        )
      )
      .limit(1)

    if (!message) throw new NotFoundError('Message not found')

    // Replace, never update. A rating is not editable: switching from a thumbs
    // up to a thumbs down deletes the first and records a new one, so
    // `created_at` says when the opinion the student currently holds was
    // formed, rather than when they first had any opinion at all.
    await database().transaction(async (tx) => {
      await tx
        .delete(chatMessageFeedback)
        .where(
          and(
            eq(chatMessageFeedback.messageId, message.id),
            eq(chatMessageFeedback.userId, userId)
          )
        )

      await tx.insert(chatMessageFeedback).values({
        messageId: message.id,
        userId,
        rating: body.rating,
        comment: body.comment ?? null
      })
    })

    return Response.json({ message: 'Rating saved' })
  }
}
