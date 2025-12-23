import {
  boolean,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', [
  'student',
  'admin',
  'super_admin'
])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  passwordHash: text('password_hash'), // Nullable - students don't have passwords
  role: userRoleEnum('role').notNull().default('student'),
  superuser: boolean('superuser').default(false), // Keep for backward compatibility
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
