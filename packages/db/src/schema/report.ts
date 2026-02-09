import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { users } from './user'

export const reportTypeEnum = pgEnum('report_type', ['course', 'semester'])

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),

  // Report template/format used
  reportType: reportTypeEnum('report_type').notNull(),

  // Generic resource reference (no FK — interpreted by application based on reportType)
  resourceType: text('resource_type').notNull(), // 'course' | 'degree' | ...
  resourceId: integer('resource_id').notNull(),

  // All scoping parameters: { schoolYear, curriculumYear?, terms?, ... }
  parameters: jsonb('parameters').notNull(),

  // R2 storage key
  r2Key: text('r2_key').notNull(),

  // Cached AI analysis
  aiSummaryJson: jsonb('ai_summary_json'),

  // Who triggered the generation
  createdBy: integer('created_by').references(() => users.id, {
    onDelete: 'set null'
  }),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert
