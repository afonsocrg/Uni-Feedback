import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { users } from './user'

export const emailPreferences = pgTable(
  'email_preferences',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    unsubscribeToken: text('unsubscribe_token').notNull().unique(),
    subscribedReminders: boolean('subscribed_reminders')
      .notNull()
      .default(true),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
  },
  (table) => [index('email_preferences_token_idx').on(table.unsubscribeToken)]
)

export type EmailPreferences = typeof emailPreferences.$inferSelect
export type NewEmailPreferences = typeof emailPreferences.$inferInsert
