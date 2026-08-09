import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { chats } from './chat'

export const chatMessageRoleEnum = pgEnum('chat_message_role', [
  'user',
  'assistant',
  'system',
  'tool'
])

/**
 * One turn in a chat.
 *
 * Cascades from `chats` on purpose: chats are only ever soft-deleted, so a hard
 * delete of a chat row is a deliberate admin act that wants its messages gone.
 * The no-cascade rule applies at the *user* boundary, not inside the aggregate.
 *
 * `metadata` holds everything we want when debugging but never filter on: tool
 * calls and their arguments, resolved entity candidates, finish reason, guardrail
 * verdicts, cache hits, provider request id. Keeping it as jsonb means the schema
 * does not churn every time the alpha needs one more field.
 *
 * The promoted columns are the ones that get aggregated (cost dashboards, model
 * comparisons, latency percentiles).
 */
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: serial('id').primaryKey(),
    chatId: integer('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    /** Position within the chat, so ordering never depends on id ordering. */
    seq: integer('seq').notNull(),
    role: chatMessageRoleEnum('role').notNull(),
    content: text('content').notNull(),

    metadata: jsonb('metadata').notNull().default({}),

    model: text('model'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    /** Integer micro-euros. Never a float: these get summed. */
    costMicros: integer('cost_micros'),
    latencyMs: integer('latency_ms'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    unique('chat_messages_chat_seq_unique').on(table.chatId, table.seq)
  ]
)

export type ChatMessage = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert
