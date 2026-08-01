import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { universities } from './university'

export const faculties = pgTable('faculties', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  slug: text('slug'),

  // Images
  logo: text('logo'),
  banner: text('banner'),
  logoHorizontal: text('logo_horizontal'),

  // Nullable: a faculty we add before knowing where to file it still works
  // everywhere, it just doesn't answer to any university chip.
  universityId: integer('university_id').references(() => universities.id),

  url: text('url').notNull(),
  emailSuffixes: jsonb('email_suffixes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export type Faculty = typeof faculties.$inferSelect
export type NewFaculty = typeof faculties.$inferInsert
