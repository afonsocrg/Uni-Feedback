import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core'
import { feedbackFull } from './feedback'
import { users } from './user'

export const helpfulVotes = pgTable(
  'helpful_votes',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    feedbackId: integer('feedback_id')
      .notNull()
      .references(() => feedbackFull.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
  },
  (table) => [primaryKey({ columns: [table.userId, table.feedbackId] })]
)

export type HelpfulVote = typeof helpfulVotes.$inferSelect
export type NewHelpfulVote = typeof helpfulVotes.$inferInsert
