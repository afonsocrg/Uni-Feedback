import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { courses } from './course'
import { users } from './user'

export const CORRECTION_REQUEST_FIELD_LABELS = {
  name: 'Course Name',
  acronym: 'Acronym',
  ects: 'ECTS Credits',
  terms: 'Terms / Semesters',
  url: 'Course Page URL',
  has_mandatory_exam: 'Mandatory Exam',
  description: 'Description',
  assessment: 'Assessment',
  bibliography: 'Bibliography',
  other: 'Other'
} as const

export type CorrectionRequestField =
  keyof typeof CORRECTION_REQUEST_FIELD_LABELS
export const CORRECTION_REQUEST_FIELDS = Object.keys(
  CORRECTION_REQUEST_FIELD_LABELS
) as [CorrectionRequestField, ...CorrectionRequestField[]]

export const correctionRequestFieldEnum = pgEnum(
  'correction_request_field',
  CORRECTION_REQUEST_FIELDS
)
export const correctionRequestStatusEnum = pgEnum('correction_request_status', [
  'pending',
  'approved',
  'rejected'
])

export const correctionRequests = pgTable('correction_requests', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  field: correctionRequestFieldEnum('field').notNull(),
  currentValue: text('current_value'),
  notes: text('notes').notNull(),
  status: correctionRequestStatusEnum('status').notNull().default('pending'),
  resolvedBy: integer('resolved_by').references(() => users.id, {
    onDelete: 'set null'
  }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export type CorrectionRequest = typeof correctionRequests.$inferSelect
export type NewCorrectionRequest = typeof correctionRequests.$inferInsert
