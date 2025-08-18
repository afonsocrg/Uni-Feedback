import { courseRelationships, courses, degrees, feedback, getDb } from '@db'
import { and, eq, inArray, isNotNull, or, sql } from 'drizzle-orm'

export class CourseFeedbackService {
  private env: Env
  private db: ReturnType<typeof getDb>

  constructor(env: Env) {
    this.env = env
    this.db = getDb(env)
  }

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
   * Returns the average rating, total feedback count, and average workload rating across all related courses.
   */
  async getCourseFeedbackStats(courseId: number): Promise<{
    rating: number
    feedbackCount: number
    averageWorkload: number | null
  }> {
    const result = await this.db
      .select({
        rating: sql<number>`ifnull(avg(${feedback.rating}), 0)`.as('rating'),
        feedbackCount: sql<number>`ifnull(count(${feedback.id}), 0)`.as(
          'feedback_count'
        ),
        averageWorkload: sql<
          number | null
        >`ifnull(avg(${feedback.workloadRating}), 0)`.as('average_workload')
      })
      .from(feedback)
      .where(this.getFeedbackWhereCondition(courseId))

    // Round average workload to 1 decimal place if it exists
    const avgWorkload = result[0]?.averageWorkload
    const roundedWorkload = avgWorkload
      ? Math.round(avgWorkload * 10) / 10
      : null

    return {
      rating: result[0]?.rating || 0,
      feedbackCount: result[0]?.feedbackCount || 0,
      averageWorkload: roundedWorkload
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
