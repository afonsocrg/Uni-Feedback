import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { chatMessages } from './chatMessage'
import { users } from './user'

export const chatFeedbackRatingEnum = pgEnum('chat_feedback_rating', [
  'helpful',
  'not_helpful'
])

/**
 * A student's verdict on one assistant answer.
 *
 * **Per message, not per chat.** A chat is a sequence of turns of varying
 * quality, so "this chat was bad" is not actionable. "This answer was bad" points
 * at one message, one set of tool calls, and one set of retrieved entities.
 *
 * This is the cheapest detector we have for the failure mode Phase 0 showed
 * matters most: confident, well-formatted, wrong answers. Those are invisible to
 * cost dashboards and error rates, and a thumbs down on a fluent answer is the
 * only cheap signal that finds them.
 *
 * `comment` is only ever asked for after a thumbs down. Asking everyone to write
 * gets no data; asking the annoyed minority gets the useful data.
 *
 * `userId` declares no `onDelete`, same reasoning as `chats.userId`.
 */
export const chatMessageFeedback = pgTable(
  'chat_message_feedback',
  {
    id: serial('id').primaryKey(),
    messageId: integer('message_id')
      .notNull()
      .references(() => chatMessages.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    rating: chatFeedbackRatingEnum('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    unique('chat_message_feedback_unique').on(table.messageId, table.userId)
  ]
)

export type ChatMessageFeedback = typeof chatMessageFeedback.$inferSelect
export type NewChatMessageFeedback = typeof chatMessageFeedback.$inferInsert
