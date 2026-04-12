import { relations } from 'drizzle-orm'
import { courses } from './course'
import { degrees } from './degree'
import { emailPreferences } from './emailPreferences'
import { faculties } from './faculty'
import { feedbackFull } from './feedback'
import { feedbackAnalysis } from './feedbackAnalysis'
import { feedbackFlags } from './feedbackFlag'
import { helpfulVotes } from './helpfulVote'
import { pointRegistry } from './pointRegistry'
import { reports } from './report'
import { users } from './user'

// FeedbackFull relations (table - includes all feedback)
// Note: Drizzle relations only work with tables, not views.
// Use the `feedback` view for queries that should exclude soft-deleted feedback.
export const feedbackFullRelations = relations(feedbackFull, ({ one }) => ({
  course: one(courses, {
    fields: [feedbackFull.courseId],
    references: [courses.id]
  }),
  user: one(users, {
    fields: [feedbackFull.userId],
    references: [users.id]
  }),
  analysis: one(feedbackAnalysis, {
    fields: [feedbackFull.id],
    references: [feedbackAnalysis.feedbackId]
  })
}))

// Course relations
export const courseRelations = relations(courses, ({ one, many }) => ({
  degree: one(degrees, {
    fields: [courses.degreeId],
    references: [degrees.id]
  }),
  feedbacks: many(feedbackFull)
}))

// Degree relations
export const degreeRelations = relations(degrees, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [degrees.facultyId],
    references: [faculties.id]
  }),
  courses: many(courses)
}))

// Faculty relations
export const facultyRelations = relations(faculties, ({ many }) => ({
  degrees: many(degrees)
}))

// User relations
export const userRelations = relations(users, ({ one, many }) => ({
  feedbacks: many(feedbackFull),
  points: many(pointRegistry),
  helpfulVotes: many(helpfulVotes),
  feedbackFlags: many(feedbackFlags),
  emailPreferences: one(emailPreferences, {
    fields: [users.id],
    references: [emailPreferences.userId]
  })
}))

// Feedback Analysis relations
// References feedbackFull because analysis exists even for soft-deleted feedback
export const feedbackAnalysisRelations = relations(
  feedbackAnalysis,
  ({ one }) => ({
    feedback: one(feedbackFull, {
      fields: [feedbackAnalysis.feedbackId],
      references: [feedbackFull.id]
    })
  })
)

// Point Registry relations
export const pointRegistryRelations = relations(pointRegistry, ({ one }) => ({
  user: one(users, {
    fields: [pointRegistry.userId],
    references: [users.id]
  })
}))

// Helpful Vote relations
export const helpfulVoteRelations = relations(helpfulVotes, ({ one }) => ({
  user: one(users, {
    fields: [helpfulVotes.userId],
    references: [users.id]
  }),
  feedback: one(feedbackFull, {
    fields: [helpfulVotes.feedbackId],
    references: [feedbackFull.id]
  })
}))

// FeedbackFlag relations (moderation flags on feedback)
export const feedbackFlagRelations = relations(feedbackFlags, ({ one }) => ({
  user: one(users, {
    fields: [feedbackFlags.userId],
    references: [users.id]
  }),
  feedback: one(feedbackFull, {
    fields: [feedbackFlags.feedbackId],
    references: [feedbackFull.id]
  })
}))

// Report relations (generated PDF reports)
export const reportRelations = relations(reports, ({ one }) => ({
  createdBy: one(users, {
    fields: [reports.createdBy],
    references: [users.id]
  })
}))

// Email Preferences relations
export const emailPreferencesRelations = relations(
  emailPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [emailPreferences.userId],
      references: [users.id]
    })
  })
)
