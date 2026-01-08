import { database } from '@uni-feedback/db'
import {
  feedback,
  feedbackAnalysis,
  pointRegistry,
  type PointSourceType
} from '@uni-feedback/db/schema'
import { and, count, eq, ne, sum } from 'drizzle-orm'

export interface AnalysisResult {
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
  wordCount: number
}

export class PointService {
  private env?: Env

  constructor(env?: Env) {
    this.env = env
  }

  /**
   * Get the total points for a user (sum of all points).
   *
   * @param userId - The user's ID
   * @returns Total points
   */
  async getUserTotalPoints(userId: number): Promise<number> {
    const result = await database()
      .select({ total: sum(pointRegistry.amount) })
      .from(pointRegistry)
      .where(eq(pointRegistry.userId, userId))

    return Number(result[0]?.total || 0)
  }

  /**
   * Calculate points to award for a feedback submission based on analysis.
   *
   * Rules:
   * - If word count < 20: 0 points
   * - Otherwise: 4 base points + 4 points per category detected
   * - Maximum: 20 points (4 base + 4×4 categories)
   *
   * @param analysis - The analysis result from analyzeComment
   * @returns Number of points to award (0-20)
   */
  calculateFeedbackPoints(analysis: AnalysisResult): number {
    if (analysis.wordCount < 20) {
      return 0
    }

    const categoryCount =
      (analysis.hasTeaching ? 1 : 0) +
      (analysis.hasAssessment ? 1 : 0) +
      (analysis.hasMaterials ? 1 : 0) +
      (analysis.hasTips ? 1 : 0)

    return 4 + categoryCount * 4
  }

  /**
   * Award points to a user for submitting feedback.
   *
   * @param userId - The user who submitted the feedback
   * @param feedbackId - The ID of the submitted feedback
   * @param points - Number of points to award
   */
  async awardFeedbackPoints(
    userId: number,
    feedbackId: number,
    points: number
  ): Promise<void> {
    await database()
      .insert(pointRegistry)
      .values({
        userId,
        amount: points,
        sourceType: 'submit_feedback',
        referenceId: feedbackId,
        comment: `Awarded ${points} points for feedback #${feedbackId}`
      })
  }

  /**
   * Check if this is the user's first feedback.
   *
   * @param userId - The user's ID
   * @param currentFeedbackId - The ID of the current feedback (to exclude from count)
   * @returns True if this is the user's first feedback
   */
  async isUserFirstFeedback(
    userId: number,
    currentFeedbackId: number
  ): Promise<boolean> {
    const result = await database()
      .select({ count: count() })
      .from(feedback)
      .where(
        and(eq(feedback.userId, userId), ne(feedback.id, currentFeedbackId))
      )

    return (result[0]?.count || 0) === 0
  }

  /**
   * Zero out points for a feedback submission (used when feedback is unapproved).
   * Sets amount to 0 and adds a comment explaining why.
   *
   * @param userId - The user who submitted the feedback
   * @param feedbackId - The ID of the feedback
   * @param reason - Reason for zeroing out points (added to comment)
   */
  async zeroOutFeedbackPoints(
    userId: number,
    feedbackId: number,
    reason: string
  ): Promise<void> {
    await database()
      .update(pointRegistry)
      .set({
        amount: 0,
        updatedAt: new Date(),
        comment: reason
      })
      .where(
        and(
          eq(pointRegistry.userId, userId),
          eq(pointRegistry.sourceType, 'submit_feedback'),
          eq(pointRegistry.referenceId, feedbackId)
        )
      )
  }

  /**
   * Restore points for a feedback submission (used when feedback is re-approved).
   * Recalculates points from the stored analysis and updates the point registry.
   *
   * @param userId - The user who submitted the feedback
   * @param feedbackId - The ID of the feedback
   */
  async restoreFeedbackPoints(
    userId: number,
    feedbackId: number
  ): Promise<void> {
    // Get the stored analysis
    const [analysis] = await database()
      .select()
      .from(feedbackAnalysis)
      .where(eq(feedbackAnalysis.feedbackId, feedbackId))
      .limit(1)

    if (!analysis) {
      console.error(`No analysis found for feedback ${feedbackId}`)
      return
    }

    // Recalculate points
    const points = this.calculateFeedbackPoints(analysis)

    // Update the point registry
    await database()
      .update(pointRegistry)
      .set({
        amount: points,
        comment: 'Points restored after re-approval'
      })
      .where(
        and(
          eq(pointRegistry.userId, userId),
          eq(pointRegistry.sourceType, 'submit_feedback'),
          eq(pointRegistry.referenceId, feedbackId)
        )
      )
  }

  /**
   * Update points for a feedback submission based on new analysis.
   * Creates a point registry entry if it doesn't exist, updates it if it does.
   *
   * @param userId - The user who submitted the feedback
   * @param feedbackId - The ID of the feedback
   * @param newAnalysis - The updated analysis result
   * @returns The number of points awarded
   */
  async updateFeedbackPoints(
    userId: number,
    feedbackId: number,
    newAnalysis: AnalysisResult
  ): Promise<number> {
    // Calculate points based on new analysis
    const points = this.calculateFeedbackPoints(newAnalysis)

    // Check if point registry entry exists
    const existingEntry = await database()
      .select()
      .from(pointRegistry)
      .where(
        and(
          eq(pointRegistry.userId, userId),
          eq(pointRegistry.sourceType, 'submit_feedback'),
          eq(pointRegistry.referenceId, feedbackId)
        )
      )
      .limit(1)

    if (existingEntry.length > 0) {
      // Update existing entry
      await database()
        .update(pointRegistry)
        .set({
          amount: points,
          updatedAt: new Date(),
          comment: `Updated to ${points} points after analysis change`
        })
        .where(
          and(
            eq(pointRegistry.userId, userId),
            eq(pointRegistry.sourceType, 'submit_feedback'),
            eq(pointRegistry.referenceId, feedbackId)
          )
        )
    } else {
      // Create new entry
      await database()
        .insert(pointRegistry)
        .values({
          userId,
          amount: points,
          sourceType: 'submit_feedback',
          referenceId: feedbackId,
          comment: `Awarded ${points} points for feedback #${feedbackId}`
        })
    }

    return points
  }

  /**
   * Check if a referrer has already been awarded points for a specific referred user.
   * This prevents duplicate point awards.
   *
   * @param referrerId - The referrer's user ID
   * @param newUserId - The referred user's ID
   * @returns True if points have already been awarded for this referral
   */
  async hasReceivedReferralPointsFor(
    referrerId: number,
    newUserId: number
  ): Promise<boolean> {
    const result = await database()
      .select({ count: count() })
      .from(pointRegistry)
      .where(
        and(
          eq(pointRegistry.userId, referrerId),
          eq(pointRegistry.sourceType, 'referral'),
          eq(pointRegistry.referenceId, newUserId)
        )
      )

    return (result[0]?.count || 0) > 0
  }
  /**
   * Get the count of successful referrals for a user.
   * A referral is successful when the referred user has submitted their first feedback
   * and referral points have been awarded.
   *
   * This counts the number of times we've awarded referral points to this user,
   * which accurately reflects the tiered system (0-5: 10pts, 6-15: 5pts, 16+: 1pt).
   *
   * @param userId - The referrer's user ID
   * @returns Number of times referral points have been awarded
   */
  async getReferralCount(userId: number): Promise<number> {
    const result = await database()
      .select({ count: count() })
      .from(pointRegistry)
      .where(
        and(
          eq(pointRegistry.userId, userId),
          eq(pointRegistry.sourceType, 'referral')
        )
      )

    return result[0]?.count || 0
  }

  /**
   * Calculate points to award for a referral based on the referrer's total referral count.
   *
   * Tiered system:
   * - 0-5 referrals: 10 points each
   * - 6-15 referrals: 5 points each
   * - 16+ referrals: 1 point each
   *
   * @param referralCount - Current number of referrals (before this one)
   * @returns Number of points to award for this referral
   */
  calculateReferralPoints(referralCount: number): number {
    if (referralCount < 5) {
      return 10
    } else if (referralCount < 15) {
      return 5
    } else {
      return 1
    }
  }

  /**
   * Award points to a user for referring another user.
   *
   * @param referrerId - The user who referred someone
   * @param newUserId - The ID of the newly registered user
   * @param points - Number of points to award
   */
  async awardReferralPoints(
    referrerId: number,
    newUserId: number,
    points: number
  ): Promise<void> {
    const referralCount = await this.getReferralCount(referrerId)

    await database()
      .insert(pointRegistry)
      .values({
        userId: referrerId,
        amount: points,
        sourceType: 'referral',
        referenceId: newUserId,
        comment: `Referral #${referralCount + 1}`
      })
  }

  /**
   * Get the points amount for a specific point registry entry.
   *
   * @param userId - The user's ID (if null, returns null)
   * @param sourceType - The type of the point source (e.g., 'submit_feedback', 'referral')
   * @param referenceId - The reference ID (e.g., feedbackId for submit_feedback)
   * @returns The points amount, or null if the entry doesn't exist
   */
  async getPointsForEntry(
    userId: number | null,
    sourceType: PointSourceType,
    referenceId: number
  ): Promise<number | null> {
    if (!userId || !sourceType || !referenceId) return null

    try {
      const result = await database()
        .select({
          amount: pointRegistry.amount
        })
        .from(pointRegistry)
        .where(
          and(
            eq(pointRegistry.userId, userId),
            eq(pointRegistry.referenceId, referenceId),
            eq(pointRegistry.sourceType, sourceType)
          )
        )
        .limit(1)

      return result[0]?.amount || null
    } catch {
      return null
    }
  }
}
