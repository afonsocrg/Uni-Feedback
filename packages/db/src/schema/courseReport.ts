import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'
import { courses } from './course'

export const reportStatusEnum = pgEnum('report_status', [
  'GENERATING',
  'READY',
  'FAILED'
])

export const courseReports = pgTable(
  'course_reports',
  {
    id: serial('id').primaryKey(),

    // Reference to course
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    // Academic year (e.g., 2024)
    schoolYear: integer('school_year').notNull(),
    // R2 storage key (e.g., "reports/2024/course-123-2024.pdf")
    r2Key: text('r2_key').notNull(),
    // Cached OpenRouter response for AI summary
    aiSummaryJson: jsonb('ai_summary_json'),
    // Snapshot of feedback at generation time
    feedbackCount: integer('feedback_count').notNull(),
    lastFeedbackTimestamp: timestamp('last_feedback_timestamp', {
      withTimezone: true
    }),
    // Template version for cache invalidation
    templateVersion: integer('template_version').notNull().default(1),
    // Generation status
    status: reportStatusEnum('status').notNull().default('GENERATING'),
    errorMessage: text('error_message'),
    generationAttempts: integer('generation_attempts').notNull().default(1),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    // Unique constraint: one cache entry per course+year combination
    uniqueCourseYear: unique().on(table.courseId, table.schoolYear)
  })
)

export type CourseReport = typeof courseReports.$inferSelect
export type NewCourseReport = typeof courseReports.$inferInsert
