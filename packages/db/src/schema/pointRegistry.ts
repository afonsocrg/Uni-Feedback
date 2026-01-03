import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { users } from './user'

export const pointSourceTypeEnum = pgEnum('point_source_type', [
  'submit_feedback',
  'referral'
])

export const pointRegistry = pgTable('point_registry', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  amount: integer('amount').notNull(),
  sourceType: pointSourceTypeEnum('source_type').notNull(),
  referenceId: integer('reference_id'),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
})

export type PointRegistry = typeof pointRegistry.$inferSelect
export type NewPointRegistry = typeof pointRegistry.$inferInsert
