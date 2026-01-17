import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  testimonial: text('testimonial').notNull(),
  name: text('name').notNull(),
  course: text('course').notNull(),
  avatarUrl: text('avatar_url'),
  url: text('url'),

  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export type Testimonial = typeof testimonials.$inferSelect
export type NewTestimonial = typeof testimonials.$inferInsert
