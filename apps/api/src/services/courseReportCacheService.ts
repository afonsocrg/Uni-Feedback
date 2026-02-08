import { database } from '@uni-feedback/db'
import {
  courseReports,
  feedback,
  type CourseReport,
  type NewCourseReport
} from '@uni-feedback/db/schema'
import { and, desc, eq, isNotNull } from 'drizzle-orm'

interface FeedbackSnapshot {
  feedbackCount: number
  lastFeedbackTimestamp: Date | null
}

interface StalenessCheckResult {
  isStale: boolean
  reason: string | null
}

export class CourseReportCacheService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  /**
   * Get existing cache entry for a course and year.
   */
  async getCacheEntry(
    courseId: number,
    schoolYear: number
  ): Promise<CourseReport | null> {
    const results = await database()
      .select()
      .from(courseReports)
      .where(
        and(
          eq(courseReports.courseId, courseId),
          eq(courseReports.schoolYear, schoolYear)
        )
      )
      .limit(1)

    return results.length > 0 ? results[0] : null
  }

  /**
   * Get current feedback snapshot for a course and year.
   */
  async getFeedbackSnapshot(
    courseId: number,
    schoolYear: number
  ): Promise<FeedbackSnapshot> {
    const feedbackResults = await database()
      .select({
        id: feedback.id,
        updatedAt: feedback.updatedAt
      })
      .from(feedback)
      .where(
        and(
          eq(feedback.courseId, courseId),
          eq(feedback.schoolYear, schoolYear),
          isNotNull(feedback.approvedAt)
        )
      )
      .orderBy(desc(feedback.updatedAt))

    const feedbackCount = feedbackResults.length
    const lastFeedbackTimestamp =
      feedbackCount > 0 ? feedbackResults[0].updatedAt : null

    return {
      feedbackCount,
      lastFeedbackTimestamp
    }
  }

  /**
   * Check if cache is stale.
   *
   * Cache is stale if any of these changed:
   * 1. Feedback count (new/removed feedback)
   * 2. Latest feedback timestamp (feedback edited)
   * 3. Template version (template/schema changed)
   *
   * If stale for any reason, we regenerate both AI analysis and PDF.
   */
  isStale(
    cache: CourseReport,
    snapshot: FeedbackSnapshot
  ): StalenessCheckResult {
    // Check feedback count
    if (cache.feedbackCount !== snapshot.feedbackCount) {
      return {
        isStale: true,
        reason: `Feedback count changed (${cache.feedbackCount} → ${snapshot.feedbackCount})`
      }
    }

    // Check last feedback timestamp
    const cacheTimestamp = cache.lastFeedbackTimestamp?.getTime() || 0
    const snapshotTimestamp = snapshot.lastFeedbackTimestamp?.getTime() || 0

    if (cacheTimestamp !== snapshotTimestamp) {
      return {
        isStale: true,
        reason: 'Feedback updated'
      }
    }

    // Check template version
    const currentTemplateVersion = parseInt(
      this.env.REPORT_TEMPLATE_VERSION || '1'
    )

    if (cache.templateVersion !== currentTemplateVersion) {
      return {
        isStale: true,
        reason: `Template version changed (${cache.templateVersion} → ${currentTemplateVersion})`
      }
    }

    // Cache is fresh
    return {
      isStale: false,
      reason: null
    }
  }

  /**
   * Atomically try to lock generation by inserting a GENERATING status entry.
   * Returns true if lock acquired, false if already exists.
   */
  async tryLockGeneration(
    courseId: number,
    schoolYear: number,
    r2Key: string,
    feedbackSnapshot: FeedbackSnapshot
  ): Promise<boolean> {
    const templateVersion = parseInt(this.env.REPORT_TEMPLATE_VERSION || '1')

    const newEntry: NewCourseReport = {
      courseId,
      schoolYear,
      r2Key,
      status: 'GENERATING',
      feedbackCount: feedbackSnapshot.feedbackCount,
      lastFeedbackTimestamp: feedbackSnapshot.lastFeedbackTimestamp,
      templateVersion,
      generationAttempts: 1
    }

    try {
      await database().insert(courseReports).values(newEntry)
      return true
    } catch (error: any) {
      // Check if error is unique constraint violation
      if (error.code === '23505') {
        // Unique constraint violation - entry already exists
        return false
      }
      throw error
    }
  }

  /**
   * Mark cache entry as complete with READY status.
   */
  async markComplete(
    courseId: number,
    schoolYear: number,
    aiSummaryJson: any,
    feedbackSnapshot: FeedbackSnapshot
  ): Promise<void> {
    const templateVersion = parseInt(this.env.REPORT_TEMPLATE_VERSION || '1')

    await database()
      .update(courseReports)
      .set({
        status: 'READY',
        aiSummaryJson,
        feedbackCount: feedbackSnapshot.feedbackCount,
        lastFeedbackTimestamp: feedbackSnapshot.lastFeedbackTimestamp,
        templateVersion,
        errorMessage: null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(courseReports.courseId, courseId),
          eq(courseReports.schoolYear, schoolYear)
        )
      )
  }

  /**
   * Mark cache entry as failed.
   */
  async markFailed(
    courseId: number,
    schoolYear: number,
    errorMessage: string
  ): Promise<void> {
    await database()
      .update(courseReports)
      .set({
        status: 'FAILED',
        errorMessage,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(courseReports.courseId, courseId),
          eq(courseReports.schoolYear, schoolYear)
        )
      )
  }

  /**
   * Update last accessed timestamp (fire-and-forget).
   */
  updateLastAccessed(courseId: number, schoolYear: number): void {
    database()
      .update(courseReports)
      .set({
        lastAccessedAt: new Date()
      })
      .where(
        and(
          eq(courseReports.courseId, courseId),
          eq(courseReports.schoolYear, schoolYear)
        )
      )
      .then(() => {
        // Fire and forget
      })
      .catch((error) => {
        console.error('Failed to update lastAccessedAt:', error)
      })
  }
}
