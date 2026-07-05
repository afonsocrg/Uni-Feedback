import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex
} from 'drizzle-orm/pg-core'
import { faculties } from './faculty'

export const teachers = pgTable(
  'teachers',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    facultyId: integer('faculty_id').references(() => faculties.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
  },
  (table) => [uniqueIndex('teachers_email_unique').on(table.email)]
)

export type Teacher = typeof teachers.$inferSelect
export type NewTeacher = typeof teachers.$inferInsert
