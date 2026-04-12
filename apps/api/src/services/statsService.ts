/**
 * Service for managing course and degree statistics.
 *
 * Stats are updated incrementally via event handlers (onFeedbackApproved, etc.)
 * called from route handlers after feedback changes.
 *
 * NOTE: If we ever need a cron job for periodic maintenance/sanity checks,
 * consider adding an incremental refresh method that only recalculates
 * courses/degrees with recent feedback activity, rather than using refreshAllStats().
 */

import { database } from '@uni-feedback/db'
import {
  courseRelationships,
  courses,
  courseStats,
  degreeStats,
  feedback
} from '@uni-feedback/db/schema'
import { and, count, eq, inArray, isNotNull, or, sql } from 'drizzle-orm'

export class StatsService {
  /**
   * Call when feedback becomes visible (submitted with auto-approve, or manually approved)
   */
  async onFeedbackApproved(courseId: number): Promise<void> {
    const courseIds = await this.getIdenticalCourseIds(courseId)
    await this.recalculateCourseGroupStats(courseId, courseIds)
    await this.incrementDegreeFeedbackCount(courseIds)
  }

  /**
   * Call when feedback becomes invisible (unapproved or soft-deleted)
   */
  async onFeedbackUnapproved(courseId: number): Promise<void> {
    const courseIds = await this.getIdenticalCourseIds(courseId)
    await this.recalculateCourseGroupStats(courseId, courseIds)
    await this.decrementDegreeFeedbackCount(courseIds)
  }

  /**
   * Call when feedback is edited (rating or workload changed)
   * Only affects course stats, not degree stats
   */
  async onFeedbackEdited(courseId: number): Promise<void> {
    const courseIds = await this.getIdenticalCourseIds(courseId)
    await this.recalculateCourseGroupStats(courseId, courseIds)
  }

  /**
   * Recalculate stats for a course group (identical courses)
   */
  private async recalculateCourseGroupStats(
    courseId: number,
    courseIds: number[]
  ): Promise<void> {
    const stats = await this.calculateCourseStats(courseId)
    await this.upsertCourseStats(courseIds, stats)
  }

  /**
   * Increment feedback count for degrees of the given courses
   */
  private async incrementDegreeFeedbackCount(
    courseIds: number[]
  ): Promise<void> {
    const db = database()
    const degreeIds = await this.getDegreeIdsForCourses(courseIds)

    for (const degreeId of degreeIds) {
      await db
        .update(degreeStats)
        .set({
          feedbackCount: sql`${degreeStats.feedbackCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(degreeStats.degreeId, degreeId))
    }
  }

  /**
   * Decrement feedback count for degrees of the given courses
   */
  private async decrementDegreeFeedbackCount(
    courseIds: number[]
  ): Promise<void> {
    const db = database()
    const degreeIds = await this.getDegreeIdsForCourses(courseIds)

    for (const degreeId of degreeIds) {
      await db
        .update(degreeStats)
        .set({
          feedbackCount: sql`GREATEST(${degreeStats.feedbackCount} - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(degreeStats.degreeId, degreeId))
    }
  }

  /**
   * Get all course IDs that are "identical" to the given course,
   * including the course itself.
   */
  private async getIdenticalCourseIds(courseId: number): Promise<number[]> {
    const db = database()

    const related = await db
      .select({ targetCourseId: courseRelationships.targetCourseId })
      .from(courseRelationships)
      .where(
        and(
          eq(courseRelationships.sourceCourseId, courseId),
          eq(courseRelationships.relationshipType, 'identical')
        )
      )

    return [courseId, ...related.map((r) => r.targetCourseId)]
  }

  /**
   * Calculate stats for a course (considering all identical courses' feedback)
   */
  private async calculateCourseStats(courseId: number): Promise<{
    averageRating: number | null
    averageWorkload: number | null
    totalFeedbackCount: number
  }> {
    const db = database()

    // Subquery for related course IDs
    const relatedCourseIds = db
      .select({ id: courseRelationships.targetCourseId })
      .from(courseRelationships)
      .where(
        and(
          eq(courseRelationships.sourceCourseId, courseId),
          eq(courseRelationships.relationshipType, 'identical')
        )
      )

    const result = await db
      .select({
        averageRating: sql<number | null>`avg(${feedback.rating})::real`,
        averageWorkload: sql<
          number | null
        >`avg(${feedback.workloadRating})::real`,
        totalFeedbackCount: sql<number>`count(distinct ${feedback.id})::integer`
      })
      .from(feedback)
      .where(
        and(
          isNotNull(feedback.approvedAt),
          or(
            eq(feedback.courseId, courseId),
            inArray(feedback.courseId, relatedCourseIds)
          )
        )
      )

    const row = result[0]
    return {
      averageRating: row?.averageRating ?? null,
      averageWorkload: row?.averageWorkload ?? null,
      totalFeedbackCount: row?.totalFeedbackCount ?? 0
    }
  }

  /**
   * Upsert course stats for multiple courses with the same values
   */
  private async upsertCourseStats(
    courseIds: number[],
    stats: {
      averageRating: number | null
      averageWorkload: number | null
      totalFeedbackCount: number
    }
  ): Promise<void> {
    const db = database()

    for (const courseId of courseIds) {
      await db
        .insert(courseStats)
        .values({
          courseId,
          averageRating: stats.averageRating,
          averageWorkload: stats.averageWorkload,
          totalFeedbackCount: stats.totalFeedbackCount,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: courseStats.courseId,
          set: {
            averageRating: stats.averageRating,
            averageWorkload: stats.averageWorkload,
            totalFeedbackCount: stats.totalFeedbackCount,
            updatedAt: new Date()
          }
        })
    }
  }

  /**
   * Get degree IDs for a list of courses
   */
  private async getDegreeIdsForCourses(courseIds: number[]): Promise<number[]> {
    const db = database()

    const result = await db
      .selectDistinct({ degreeId: courses.degreeId })
      .from(courses)
      .where(inArray(courses.id, courseIds))

    return result
      .map((r) => r.degreeId)
      .filter((id): id is number => id !== null)
  }

  /**
   * Recalculate stats for a single degree
   */
  private async recalculateDegreeStats(degreeId: number): Promise<void> {
    const db = database()

    // Subquery for related course IDs (parameterized by course)
    const getRelatedCourseIds = (courseId: typeof courses.id) =>
      db
        .select({ id: courseRelationships.targetCourseId })
        .from(courseRelationships)
        .where(
          and(
            eq(courseRelationships.sourceCourseId, courseId),
            eq(courseRelationships.relationshipType, 'identical')
          )
        )

    // Count courses in degree
    const courseCountResult = await db
      .select({ count: count() })
      .from(courses)
      .where(eq(courses.degreeId, degreeId))

    // Count feedback for courses in degree (including related courses)
    const feedbackCountResult = await db
      .select({
        count: sql<number>`count(distinct ${feedback.id})::integer`
      })
      .from(courses)
      .leftJoin(
        feedback,
        and(
          isNotNull(feedback.approvedAt),
          or(
            eq(feedback.courseId, courses.id),
            inArray(feedback.courseId, getRelatedCourseIds(courses.id))
          )
        )
      )
      .where(eq(courses.degreeId, degreeId))

    const courseCount = courseCountResult[0]?.count ?? 0
    const feedbackCount = feedbackCountResult[0]?.count ?? 0

    await db
      .insert(degreeStats)
      .values({
        degreeId,
        courseCount,
        feedbackCount,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: degreeStats.degreeId,
        set: {
          courseCount,
          feedbackCount,
          updatedAt: new Date()
        }
      })
  }

  /**
   * Refresh all stats (for initial population or manual refresh)
   */
  async refreshAllStats(): Promise<{
    coursesUpdated: number
    degreesUpdated: number
  }> {
    const db = database()

    // Get all courses
    const allCourses = await db.select({ id: courses.id }).from(courses)
    const processedCourseIds = new Set<number>()

    // Process each course group once
    for (const course of allCourses) {
      if (processedCourseIds.has(course.id)) continue

      const groupIds = await this.getIdenticalCourseIds(course.id)
      const stats = await this.calculateCourseStats(course.id)
      await this.upsertCourseStats(groupIds, stats)

      groupIds.forEach((id) => processedCourseIds.add(id))
    }

    // Get all degrees and update
    const allDegrees = await db
      .selectDistinct({ id: courses.degreeId })
      .from(courses)
      .where(isNotNull(courses.degreeId))

    for (const degree of allDegrees) {
      if (degree.id) {
        await this.recalculateDegreeStats(degree.id)
      }
    }

    return {
      coursesUpdated: processedCourseIds.size,
      degreesUpdated: allDegrees.filter((d) => d.id !== null).length
    }
  }
}
