import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { users } from './user'

/**
 * Answers to what a chat access request tells us.
 *
 * `question` is stored verbatim and denormalised even when a `chat_messages`
 * row exists, because a chat can be soft-deleted and this row should still make
 * sense on its own.
 */
export interface ChatAccessRequestResponses {
  /** Faculty ids they picked, plus anything they typed for ones we do not list. */
  facultyIds?: number[]
  otherUniversities?: string
  /**
   * Who they are, several at a time. The form is a multi-select because the
   * options are not on one axis, so the combinations carry real information:
   * `bachelor` + `want_masters` is a switcher in progress, `high_school` +
   * `applying` is someone in the middle of applying rather than two years out.
   */
  roles?: string[]
  /** The UI language they were reading in. Recorded rather than asked. */
  locale?: string
  /** The question they typed, when there was one. */
  question?: string
  /** The structured gap the harness attached to the answer, when there was one. */
  gap?: Record<string, unknown>
  /** Points into a conversation when the asker had an account. */
  messageId?: number
}

/**
 * Someone who wants the chat but cannot get to it.
 *
 * Originally the coverage wall's waitlist: a logged-in student whose faculty was
 * not `chat_enabled`. That gate was removed before launch (see the PRD's
 * "Access, walls and the coverage gate"), so the people who need this now are
 * the ones who cannot sign up at all: school students, graduates, and anyone
 * whose university is not on a whitelisted domain yet.
 *
 * `userId` is therefore nullable and `email` is the identifier, but it is not
 * unique: every submission is its own row, including a second one from the same
 * address. An upsert here read as tidy and was quietly lossy, since the person
 * asking again is usually the one adding a university or a question we did not
 * have. "How many people are waiting" is `count(DISTINCT email)`, which is the
 * cheap half of that trade.
 *
 * `responses` is jsonb rather than a set of columns and a link table. That
 * deliberately reverses the argument `chat_message_entities` makes, and the
 * reason is lifespan: this table disappears when non-university signup lands,
 * counting still works over jsonb, and a temporary table earning schema churn is
 * the worse trade.
 *
 * `notifiedAt` closes the loop: when we open to a university, everyone waiting
 * gets an email, which makes this a warm re-engagement list of people who
 * already told us they want it.
 */
export const chatAccessRequests = pgTable(
  'chat_access_requests',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    email: text('email').notNull(),
    /** Which surface it came from: 'login_wall' | 'chat_gap' | ... */
    source: text('source'),
    responses: jsonb('responses')
      .$type<ChatAccessRequestResponses>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    notifiedAt: timestamp('notified_at', { withTimezone: true })
  },
  (table) => [
    // Lookups by address, and the repeat check the request endpoint runs
    // before writing. Not unique: see the note above on why duplicates stay.
    index('chat_access_requests_email_idx').on(table.email),
    // The notify-when-we-open query: everyone not yet contacted, oldest first.
    index('chat_access_requests_notified_idx').on(
      table.notifiedAt,
      table.createdAt
    )
  ]
)

export type ChatAccessRequest = typeof chatAccessRequests.$inferSelect
export type NewChatAccessRequest = typeof chatAccessRequests.$inferInsert
