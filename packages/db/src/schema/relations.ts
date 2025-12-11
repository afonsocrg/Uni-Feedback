import { relations } from 'drizzle-orm'
import { courses } from './course'
import { degrees } from './degree'
import { faculties } from './faculty'
import { feedback } from './feedback'

// Feedback relations
export const feedbackRelations = relations(feedback, ({ one }) => ({
  course: one(courses, {
    fields: [feedback.courseId],
    references: [courses.id]
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
