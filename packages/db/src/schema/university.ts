import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * The institution a faculty belongs to (ULisboa, NOVA, ISCTE, ...).
 *
 * Faculties are the unit students actually pick, and always will be: a NOVA SBE
 * student has nothing to do with NOVA Medical School's courses. The university
 * exists to *group* them, so a list that is already 13 entries long stays
 * navigable as it grows.
 *
 * Mirrors `faculties` on purpose (same name / short_name / slug / logo fields),
 * minus `email_suffixes`, which identifies a student's faculty and so has no
 * meaning one level up, and minus `banner`, which is NULL for all 13 faculties.
 */
export const universities = pgTable('universities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  // Used as the value of the faculty-page university filter, so the selection
  // stays readable and stable if ids ever change.
  slug: text('slug').notNull(),

  // Images. Same convention as faculties: a path relative to the asset root,
  // resolved through `getAssetUrl`, never a full URL.
  logo: text('logo'),
  logoHorizontal: text('logo_horizontal'),

  url: text('url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export type University = typeof universities.$inferSelect
export type NewUniversity = typeof universities.$inferInsert
