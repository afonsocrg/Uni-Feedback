import { jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const faculties = pgTable('faculties', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  url: text('url').notNull(),
  emailSuffixes: jsonb('email_suffixes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export type Faculty = typeof faculties.$inferSelect
export type NewFaculty = typeof faculties.$inferInsert
