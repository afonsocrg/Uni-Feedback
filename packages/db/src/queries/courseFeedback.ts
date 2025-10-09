import { and, eq, inArray, isNotNull, or, sql, type SQL } from 'drizzle-orm'
import { courseRelationships, courses, feedback } from '../schema'
import { database } from '../context'

/**
 * Get all course IDs that should be included when fetching feedback for a given course.
 * This includes the original course ID plus any related course IDs based on course relationships.
 */
export function getRelatedCourseIdsSubquery(courseId: number) {
  return database()
    .select({ courseId: courseRelationships.targetCourseId })
    .from(courseRelationships)
    .where(
      and(
        eq(courseRelationships.sourceCourseId, courseId),
        eq(courseRelationships.relationshipType, 'identical')
      )
    )
}

/**
 * Get the base WHERE condition for feedback queries that includes related courses.
 * This centralizes the logic for filtering feedback from the original course + related courses.
 */
export function getFeedbackWhereCondition(courseId: number) {
  const relatedCourseIds = getRelatedCourseIdsSubquery(courseId)

  return and(
    isNotNull(feedback.approvedAt),
    or(
      eq(feedback.courseId, courseId),
      inArray(feedback.courseId, relatedCourseIds)
    )
  )
}

/**
 * Get the enhanced LEFT JOIN condition for feedback that includes related courses.
 * This can be used in queries that need to aggregate feedback stats across multiple courses.
 *
 * Returns a condition that matches:
 * - Direct feedback for the course (courses.id = feedback.courseId)
 * - Feedback from courses that are related to this course (via course_relationships)
 */
export function getEnhancedFeedbackJoinCondition(): SQL<unknown> | undefined {
  return and(
    isNotNull(feedback.approvedAt),
    or(
      // Direct feedback for the course
      eq(courses.id, feedback.courseId),
      // Feedback from courses that are related to this course
      inArray(
        feedback.courseId,
        database()
          .select({ targetCourseId: courseRelationships.targetCourseId })
          .from(courseRelationships)
          .where(
            and(
              eq(courseRelationships.sourceCourseId, courses.id),
              eq(courseRelationships.relationshipType, 'identical')
            )
          )
      )
    )
  )
}
