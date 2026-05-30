import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { courses } from './course'
import { feedbackFull } from './feedback'

export const audioRecordings = pgTable('audio_recordings', {
  id: serial('id').primaryKey(),
  feedbackId: integer('feedback_id').references(() => feedbackFull.id),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id),
  r2Key: text('r2_key').notNull(),
  audioFormat: text('audio_format').notNull().default('webm'),
  durationSeconds: integer('duration_seconds'),
  transcript: text('transcript'),
  consentGiven: boolean('consent_given').notNull().default(false),
  consentGivenAt: timestamp('consent_given_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

export type AudioRecording = typeof audioRecordings.$inferSelect
export type NewAudioRecording = typeof audioRecordings.$inferInsert
