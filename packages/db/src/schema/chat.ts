import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { courses } from './course'
import { degrees } from './degree'
import { faculties } from './faculty'
import { users } from './user'

/**
 * One conversation between a student and the AI chat.
 *
 * Soft-deleted, never hard-deleted: deleting a chat hides it from the user and
 * stops it being used, but the record survives. Account deletion anonymises the
 * account and leaves the chats attached to it.
 *
 * `userId` deliberately declares no `onDelete`, so Postgres defaults to NO
 * ACTION and deleting a user with chats FAILS instead of destroying them.
 * `AuthService.deleteUserAccount()` transfers these rows to the anonymised user
 * first; if that transfer is ever forgotten, the loud failure is the point.
 * Same convention as `feedbackFull.userId`.
 */
export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),

  /** Generated from the first exchange by a cheap model, so null until then. */
  title: text('title'),

  /** UI locale at creation ('pt' | 'en'). The assistant answers in the language
   * of the question, not this; this records which surface the chat came from. */
  language: text('language'),

  // Context variables. Set automatically when the student arrives from a course
  // or degree page, or manually through the selector. Retrieval defaults to this
  // scope, which removes most of the entity ambiguity that dominated the Phase 0
  // failures ("LEIC-A", "FCT" vs "Nova FCT", which university for Medicina
  // Dentária). A default, not a filter: the model can still search outside it.
  contextFacultyId: integer('context_faculty_id').references(
    () => faculties.id,
    { onDelete: 'set null' }
  ),
  contextDegreeId: integer('context_degree_id').references(() => degrees.id, {
    onDelete: 'set null'
  }),
  contextCourseId: integer('context_course_id').references(() => courses.id, {
    onDelete: 'set null'
  }),
  /** 'course_page' | 'degree_page' | 'manual' | null. Kept so we can ask whether
   * students who arrived with context got better answers than those starting cold. */
  contextSource: text('context_source'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** Denormalised so "recent chats" never has to touch chat_messages. */
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
})

export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert
