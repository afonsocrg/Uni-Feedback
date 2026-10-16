import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'
import { users } from './user'

/**
 * A degree the student says they take or took: the root of "O meu percurso".
 *
 * **Declared, not verified.** We verify the university through the login
 * email; the degree and years are whatever the student tells us. Never display
 * this as proven (afonsocrg/prds/2026-08-09_identity_and_affiliation.md, 3).
 *
 * **Only declared rows live here.** The guess we make from a student's reviews
 * is computed on read and never stored, so a row always means the student
 * confirmed or entered it. Whether that one guess was already answered is
 * `users.degree_inference_resolved_at`.
 *
 * School years use the same encoding as `feedback.school_year`: the start year,
 * so 2025 is 2025/2026. Both are optional, because a wrong year is worse than
 * none. `endSchoolYear` is the last year they were enrolled, never a future
 * graduation estimate; null means ongoing or unknown.
 *
 * Faculty is not stored: it follows from the degree.
 *
 * `userId` cascades on delete, unlike chats: this is profile data about the
 * person, so deleting the account deletes it rather than transferring it to the
 * anonymised user.
 */
export const userDegrees = pgTable(
  'user_degrees',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    degreeId: integer('degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
    startSchoolYear: integer('start_school_year'),
    endSchoolYear: integer('end_school_year'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    unique('user_degrees_user_degree_unique').on(table.userId, table.degreeId),
    index('user_degrees_degree_id_idx').on(table.degreeId),
    check(
      'user_degrees_years_order',
      sql`${table.endSchoolYear} IS NULL OR ${table.startSchoolYear} IS NULL OR ${table.endSchoolYear} >= ${table.startSchoolYear}`
    )
  ]
)

export type UserDegree = typeof userDegrees.$inferSelect
export type NewUserDegree = typeof userDegrees.$inferInsert
