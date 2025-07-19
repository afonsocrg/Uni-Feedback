import {
  courseRelationships,
  courses,
  degrees,
  feedback,
  type Database
} from '@db'
import { and, eq, isNotNull, or, sql, inArray } from 'drizzle-orm'
import { DrizzleD1Database } from 'drizzle-orm/d1'

export class CourseFeedbackService {
  constructor(private db: DrizzleD1Database<Database>) {}

  /**
   * Get all course IDs that should be included when fetching feedback for a given course.
   * This includes the original course ID plus any related course IDs based on course relationships.
   */
  private getRelevantCourseIdsQuery(courseId: number) {
    return this.db
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
  getFeedbackWhereCondition(courseId: number) {
    const relatedCourseIds = this.getRelevantCourseIdsQuery(courseId)

    return and(
      isNotNull(feedback.approvedAt),
      or(
        eq(feedback.courseId, courseId),
        inArray(feedback.courseId, relatedCourseIds)
      )
    )
  }

  /**
   * Get aggregated feedback statistics for a course, including related courses.
   * Returns the average rating and total feedback count across all related courses.
   */
  async getCourseFeedbackStats(courseId: number): Promise<{
    rating: number
    feedbackCount: number
  }> {
    const result = await this.db
      .select({
        rating: sql<number>`ifnull(avg(${feedback.rating}), 0)`.as('rating'),
        feedbackCount: sql<number>`ifnull(count(${feedback.id}), 0)`.as(
          'feedback_count'
        )
      })
      .from(feedback)
      .where(this.getFeedbackWhereCondition(courseId))

    return {
      rating: result[0]?.rating || 0,
      feedbackCount: result[0]?.feedbackCount || 0
    }
  }

  /**
   * Get all feedback for a course including related courses with full details.
   * This is used by the feedback list endpoint.
   */
  getCourseFeedbackWithDetails(courseId: number) {
    const relatedCourseIds = this.getRelevantCourseIdsQuery(courseId)

    return this.db
      .select({
        id: feedback.id,
        courseId: feedback.courseId,
        rating: feedback.rating,
        workloadRating: feedback.workloadRating,
        comment: feedback.comment,
        schoolYear: feedback.schoolYear,
        createdAt: feedback.createdAt,
        course: {
          id: courses.id,
          name: courses.name,
          acronym: courses.acronym
        },
        degree: {
          id: degrees.id,
          name: degrees.name,
          acronym: degrees.acronym
        },
        isFromDifferentCourse:
          sql<number>`${feedback.courseId} != ${courseId}`.as(
            'is_from_different_course'
          )
      })
      .from(feedback)
      .innerJoin(courses, eq(feedback.courseId, courses.id))
      .innerJoin(degrees, eq(courses.degreeId, degrees.id))
      .where(
        and(
          isNotNull(feedback.approvedAt),
          or(
            eq(feedback.courseId, courseId),
            inArray(feedback.courseId, relatedCourseIds)
          )
        )
      )
  }

  /**
   * Get the enhanced LEFT JOIN condition for feedback that includes related courses.
   * This can be used in queries that need to aggregate feedback stats across multiple courses.
   */
  getEnhancedFeedbackJoin() {
    return {
      table: feedback,
      condition: and(
        isNotNull(feedback.approvedAt),
        or(
          // Direct feedback for the course
          eq(courses.id, feedback.courseId),
          // Feedback from courses that are related to this course
          inArray(
            feedback.courseId,
            this.db
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
  }
}
