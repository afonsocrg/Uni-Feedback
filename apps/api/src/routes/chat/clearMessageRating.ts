import { requireAuth } from '@middleware'
import { database } from '@uni-feedback/db'
import {
  chatMessageFeedback,
  chatMessages,
  chats
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, inArray } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

/**
 * Take a rating back.
 *
 * Clicking a thumb you already selected clears it, and that has to reach the
 * server or the student sees an unrated answer while we hold their old verdict.
 *
 * A hard delete rather than a soft one: unlike a chat, a withdrawn rating has no
 * analytical value we are entitled to keep. If we ever want to measure how often
 * students change their minds, that belongs in an event, not in a row the
 * student believes they removed.
 */
export class ClearChatMessageRating extends OpenAPIRoute {
  schema = {
    tags: ['Chat'],
    summary: 'Remove a rating from an answer',
    request: { params: z.object({ id: z.coerce.number() }) },
    responses: {
      '200': { description: 'Rating removed' },
      '401': { description: 'Not authenticated' }
    }
  }

  async handle(c: Context) {
    const authContext = await requireAuth(c)
    const { params } = await this.getValidatedData<typeof this.schema>()
    const userId = authContext.user.id

    // Scoped through chats so one user cannot clear another's rating. Deleting
    // something that is not there is a success: the caller wanted no rating and
    // there is no rating.
    const owned = database()
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .innerJoin(chats, eq(chatMessages.chatId, chats.id))
      .where(and(eq(chatMessages.id, params.id), eq(chats.userId, userId)))

    await database()
      .delete(chatMessageFeedback)
      .where(
        and(
          eq(chatMessageFeedback.userId, userId),
          inArray(chatMessageFeedback.messageId, owned)
        )
      )

    return Response.json({ message: 'Rating removed' })
  }
}
