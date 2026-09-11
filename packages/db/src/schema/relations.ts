import { relations } from 'drizzle-orm'
import { academicTerms } from './academicTerm'
import { audioRecordings } from './audioRecording'
import { chats } from './chat'
import { chatAccessRequests } from './chatAccessRequest'
import { chatMessages } from './chatMessage'
import { chatMessageEntities } from './chatMessageEntity'
import { chatMessageFeedback } from './chatMessageFeedback'
import { correctionRequests } from './correctionRequest'
import { courses } from './course'
import { courseOfferings } from './courseOffering'
import { degrees } from './degree'
import { emailPreferences } from './emailPreferences'
import { faculties } from './faculty'
import { feedbackFull } from './feedback'
import { feedbackAnalysis } from './feedbackAnalysis'
import { feedbackFlags } from './feedbackFlag'
import { helpfulVotes } from './helpfulVote'
import { pointRegistry } from './pointRegistry'
import { reports } from './report'
import { universities } from './university'
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
  }),
  audioRecording: one(audioRecordings, {
    fields: [feedbackFull.id],
    references: [audioRecordings.feedbackId]
  })
}))

// Course relations
export const courseRelations = relations(courses, ({ one, many }) => ({
  degree: one(degrees, {
    fields: [courses.degreeId],
    references: [degrees.id]
  }),
  feedbacks: many(feedbackFull),
  offerings: many(courseOfferings)
}))

// Course Offering relations
export const courseOfferingRelations = relations(
  courseOfferings,
  ({ one }) => ({
    course: one(courses, {
      fields: [courseOfferings.courseId],
      references: [courses.id]
    }),
    academicTerm: one(academicTerms, {
      fields: [courseOfferings.academicTermId],
      references: [academicTerms.id]
    })
  })
)

// Academic Term relations
export const academicTermRelations = relations(
  academicTerms,
  ({ one, many }) => ({
    faculty: one(faculties, {
      fields: [academicTerms.facultyId],
      references: [faculties.id]
    }),
    offerings: many(courseOfferings)
  })
)

// Degree relations
export const degreeRelations = relations(degrees, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [degrees.facultyId],
    references: [faculties.id]
  }),
  courses: many(courses)
}))

// Faculty relations
export const facultyRelations = relations(faculties, ({ one, many }) => ({
  university: one(universities, {
    fields: [faculties.universityId],
    references: [universities.id]
  }),
  degrees: many(degrees),
  academicTerms: many(academicTerms)
}))

// University relations
export const universityRelations = relations(universities, ({ many }) => ({
  faculties: many(faculties)
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

// Correction Request relations
export const correctionRequestRelations = relations(
  correctionRequests,
  ({ one }) => ({
    course: one(courses, {
      fields: [correctionRequests.courseId],
      references: [courses.id]
    }),
    user: one(users, {
      fields: [correctionRequests.userId],
      references: [users.id]
    }),
    resolvedBy: one(users, {
      fields: [correctionRequests.resolvedBy],
      references: [users.id],
      relationName: 'correctionRequestResolver'
    })
  })
)

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

// Audio Recording relations
export const audioRecordingRelations = relations(
  audioRecordings,
  ({ one }) => ({
    feedback: one(feedbackFull, {
      fields: [audioRecordings.feedbackId],
      references: [feedbackFull.id]
    }),
    course: one(courses, {
      fields: [audioRecordings.courseId],
      references: [courses.id]
    })
  })
)

// Chat relations
export const chatRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id]
  }),
  contextFaculty: one(faculties, {
    fields: [chats.contextFacultyId],
    references: [faculties.id]
  }),
  contextDegree: one(degrees, {
    fields: [chats.contextDegreeId],
    references: [degrees.id]
  }),
  contextCourse: one(courses, {
    fields: [chats.contextCourseId],
    references: [courses.id]
  }),
  messages: many(chatMessages)
}))

export const chatMessageRelations = relations(
  chatMessages,
  ({ one, many }) => ({
    chat: one(chats, {
      fields: [chatMessages.chatId],
      references: [chats.id]
    }),
    entities: many(chatMessageEntities),
    feedback: many(chatMessageFeedback)
  })
)

// Deliberately polymorphic: `entityId` has no foreign key, so there is no
// relation to declare back to courses/degrees/faculties. See the table's doc
// comment for why that trade is worth it.
export const chatMessageEntityRelations = relations(
  chatMessageEntities,
  ({ one }) => ({
    message: one(chatMessages, {
      fields: [chatMessageEntities.messageId],
      references: [chatMessages.id]
    })
  })
)

export const chatMessageFeedbackRelations = relations(
  chatMessageFeedback,
  ({ one }) => ({
    message: one(chatMessages, {
      fields: [chatMessageFeedback.messageId],
      references: [chatMessages.id]
    }),
    user: one(users, {
      fields: [chatMessageFeedback.userId],
      references: [users.id]
    })
  })
)

// The faculties a request names live in `responses.facultyIds`, not in columns,
// so there is nothing to relate here beyond the optional account.
export const chatAccessRequestRelations = relations(
  chatAccessRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [chatAccessRequests.userId],
      references: [users.id]
    })
  })
)
