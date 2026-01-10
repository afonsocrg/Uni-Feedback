import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const aiCategorizationCache = pgTable('ai_categorization_cache', {
  // Primary key: SHA-256 hash of normalized comment
  commentHash: text('comment_hash').primaryKey(),

  // Categorization results
  hasTeaching: boolean('has_teaching').notNull(),
  hasAssessment: boolean('has_assessment').notNull(),
  hasMaterials: boolean('has_materials').notNull(),
  hasTips: boolean('has_tips').notNull(),

  // Metadata for debugging and monitoring
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  // Track last access for potential future cache eviction strategies
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  // Count how many times this categorization was reused (analytics)
  hitCount: integer('hit_count').notNull().default(0)
})

export type AiCategorizationCache = typeof aiCategorizationCache.$inferSelect
export type NewAiCategorizationCache = typeof aiCategorizationCache.$inferInsert
