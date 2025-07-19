import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const faculties = sqliteTable('faculties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  url: text('url').notNull(),
  emailSuffixes: text('email_suffixes', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  )
})

export type Faculty = typeof faculties.$inferSelect
export type NewFaculty = typeof faculties.$inferInsert
