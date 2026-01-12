import { relations } from 'drizzle-orm'
import { courses } from './course'
import { degrees } from './degree'
import { faculties } from './faculty'
import { feedback, feedbackFull } from './feedback'
import { feedbackAnalysis } from './feedbackAnalysis'
import { pointRegistry } from './pointRegistry'
import { users } from './user'

// Feedback relations (view - automatically excludes deleted feedback)
export const feedbackRelations = relations(feedback, ({ one }) => ({
  course: one(courses, {
    fields: [feedback.courseId],
    references: [courses.id]
  }),
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id]
  }),
  analysis: one(feedbackAnalysis, {
    fields: [feedback.id],
    references: [feedbackAnalysis.feedbackId]
  })
}))

// FeedbackFull relations (table - includes deleted feedback)
// Use this when you need to see all feedback including soft-deleted ones
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
  feedbacks: many(feedback)
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
export const userRelations = relations(users, ({ many }) => ({
  feedbacks: many(feedback),
  points: many(pointRegistry)
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
