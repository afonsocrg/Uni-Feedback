import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { faculties } from './faculty'

export const degrees = pgTable('degrees', {
  id: serial('id').primaryKey(),
  externalId: text('external_id'),
  type: text('type').notNull(),
  name: text('name').notNull(),
  acronym: text('acronym').notNull(),
  slug: text('slug'),
  campus: text('campus').notNull(), // This field may be removed later. It may be too specific
  description: text('description'),
  url: text('url'),
  facultyId: integer('faculty_id').references(() => faculties.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export type Degree = typeof degrees.$inferSelect
export type NewDegree = typeof degrees.$inferInsert
