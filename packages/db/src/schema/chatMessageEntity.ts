import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { chatMessages } from './chatMessage'

export const chatEntityTypeEnum = pgEnum('chat_entity_type', [
  'course',
  'degree',
  'faculty',
  'university',
  'feedback'
])

export const chatEntityRelationEnum = pgEnum('chat_entity_relation', [
  /** On a user message: what the student was asking about. The analytics gold. */
  'mentioned',
  /** On an assistant message: what the system actually fed the model. */
  'retrieved',
  /** The subset of retrieved data the answer actually linked to. */
  'cited'
])

/**
 * Which database entities a chat message touched, and in what capacity.
 *
 * **Polymorphic on purpose.** The query we will run every week is "what are
 * students asking about", which is one `GROUP BY` here and a five-way `UNION ALL`
 * if this were one link table per entity type, edited every time a type is added.
 * The cost is losing FK integrity, which is acceptable: courses and degrees are
 * never hard-deleted in this codebase, and a dangling row in an analytics table
 * is harmless.
 *
 * **Why `relation` matters.** `mentioned` and `retrieved` answer different
 * questions (what the student wanted vs what we fetched), and `cited` is what we
 * actually showed them. Splitting them is cheap now and impossible to recover
 * later. The Phase 0 spike populates exactly this shape, which is what validated
 * the design before any of it was built.
 */
export const chatMessageEntities = pgTable(
  'chat_message_entities',
  {
    id: serial('id').primaryKey(),
    messageId: integer('message_id')
      .notNull()
      .references(() => chatMessages.id, { onDelete: 'cascade' }),
    entityType: chatEntityTypeEnum('entity_type').notNull(),
    entityId: integer('entity_id').notNull(),
    relation: chatEntityRelationEnum('relation').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    unique('chat_message_entities_unique').on(
      table.messageId,
      table.entityType,
      table.entityId,
      table.relation
    ),
    // "everything students asked about course X"
    index('chat_message_entities_entity_idx').on(
      table.entityType,
      table.entityId
    ),
    // "what were students asking about in July"
    index('chat_message_entities_entity_time_idx').on(
      table.entityType,
      table.createdAt
    )
  ]
)

export type ChatMessageEntity = typeof chatMessageEntities.$inferSelect
export type NewChatMessageEntity = typeof chatMessageEntities.$inferInsert
