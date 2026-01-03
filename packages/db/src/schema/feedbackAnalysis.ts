import { boolean, integer, pgTable, timestamp } from 'drizzle-orm/pg-core'
import { feedback } from './feedback'

export const feedbackAnalysis = pgTable('feedback_analysis', {
  feedbackId: integer('feedback_id')
    .primaryKey()
    .references(() => feedback.id, { onDelete: 'cascade' }),
  hasTeaching: boolean('has_teaching').notNull().default(false),
  hasAssessment: boolean('has_assessment').notNull().default(false),
  hasMaterials: boolean('has_materials').notNull().default(false),
  hasTips: boolean('has_tips').notNull().default(false),
  wordCount: integer('word_count').notNull(),
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
})

export type FeedbackAnalysis = typeof feedbackAnalysis.$inferSelect
export type NewFeedbackAnalysis = typeof feedbackAnalysis.$inferInsert
