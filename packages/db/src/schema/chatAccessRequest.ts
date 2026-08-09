import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'
import { faculties } from './faculty'
import { users } from './user'

/**
 * Someone asking us to turn the chat on for their faculty.
 *
 * The coverage wall (a logged-in student whose faculty is not `chat_enabled`) is
 * the most frustrating moment in the product, and this turns it into three
 * things at once: a demand signal that sorts enrichment priority by what students
 * actually want, a prompt to help fill the gap, and a number we can put in front
 * of that university's student association ("47 ISEP students are waiting").
 *
 * `userId` is NULLABLE on purpose. Applicants and high-school students cannot
 * create an account at all under the current auth model, so the one CTA aimed at
 * them has to work without one. `email` is therefore the required identifier,
 * and the uniqueness constraint is on (email, faculty) rather than on the user.
 * See afonsocrg/prds/2026-08-09_identity_and_affiliation.md.
 *
 * `notifiedAt` closes the loop: when a faculty is switched on, everyone waiting
 * gets an email, which makes this a warm re-engagement list of people who already
 * told us they want it.
 */
export const chatAccessRequests = pgTable(
  'chat_access_requests',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    email: text('email').notNull(),
    facultyId: integer('faculty_id')
      .notNull()
      .references(() => faculties.id, { onDelete: 'cascade' }),
    degreeId: integer('degree_id').references(() => degrees.id, {
      onDelete: 'set null'
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    notifiedAt: timestamp('notified_at', { withTimezone: true })
  },
  (table) => [
    unique('chat_access_requests_email_faculty_unique').on(
      table.email,
      table.facultyId
    ),
    index('chat_access_requests_faculty_idx').on(table.facultyId)
  ]
)

export type ChatAccessRequest = typeof chatAccessRequests.$inferSelect
export type NewChatAccessRequest = typeof chatAccessRequests.$inferInsert
