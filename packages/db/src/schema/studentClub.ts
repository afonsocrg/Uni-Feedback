import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'
import { faculties } from './faculty'

export const studentClubs = pgTable('student_clubs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  slug: text('slug').notNull(),
  type: text('type').notNull().default('club'), // 'union' or 'club'

  // Images
  logo: text('logo'), // square logo
  banner: text('banner'), // wide header image
  logoHorizontal: text('logo_horizontal'), // for carousel/partner lists

  // Content
  description: text('description'),

  // Socials
  website: text('website'),
  instagram: text('instagram'),
  linkedin: text('linkedin'),
  twitter: text('twitter'),
  facebook: text('facebook'),
  email: text('email'),
  discord: text('discord'),

  // Relationships (nullable for faculty-wide clubs)
  degreeId: integer('degree_id').references(() => degrees.id),
  facultyId: integer('faculty_id').references(() => faculties.id),

  // Metadata
  sortOrder: integer('sort_order').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export type StudentClub = typeof studentClubs.$inferSelect
export type NewStudentClub = typeof studentClubs.$inferInsert
