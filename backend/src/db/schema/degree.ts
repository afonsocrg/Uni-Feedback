import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { faculties } from './faculty'

export const degrees = sqliteTable('degrees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id'),
  type: text('type').notNull(),
  name: text('name').notNull(),
  acronym: text('acronym').notNull(),
  campus: text('campus').notNull(), // This field may be removed later. It may be too specific
  facultyId: integer('faculty_id').references(() => faculties.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  )
})

export type Degree = typeof degrees.$inferSelect
export type NewDegree = typeof degrees.$inferInsert
