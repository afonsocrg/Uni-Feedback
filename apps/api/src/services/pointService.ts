import { database } from '@uni-feedback/db'
import {
  feedback,
  feedbackAnalysis,
  pointRegistry,
  users,
  type PointSourceType
} from '@uni-feedback/db/schema'
import { countWords, formatSchoolYearString } from '@uni-feedback/utils'
import { and, count, eq, isNotNull, ne, sum } from 'drizzle-orm'
import { AIService } from './aiService'

export interface AnalysisResult {
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
  wordCount: number
}

/** Flat points awarded to each side of a successful referral. */
export const REFERRAL_POINTS = 15

/** Points awarded for linking an Instagram handle to a profile. */
export const INSTAGRAM_BONUS_POINTS = 20

/**
 * Sentinel referenceId for the Instagram-link bonus row in point_registry.
 * Must be non-zero because getPointsForEntry treats a falsy referenceId as
 * "no entry".
 */
const INSTAGRAM_BONUS_REFERENCE_ID = 1

/** Points awarded for the perfect-feedback giveaway bonus. */
export const PERFECT_FEEDBACK_BONUS_POINTS = 100

/**
 * Number of "perfect" feedbacks (all 4 categories covered) a user needs for a
 * given school year to earn the bonus.
 */
export const PERFECT_FEEDBACK_THRESHOLD = 5

/**
 * School year (as stored in the DB) the perfect-feedback bonus applies to.
 * 2025 == school year 2025/2026. Also doubles as the point_registry
 * referenceId for the bonus row, so each school year gets its own idempotent
 * 'bonus' entry (distinct from the Instagram bonus' referenceId of 1).
 */
export const PERFECT_FEEDBACK_BONUS_SCHOOL_YEAR = 2025

export class PointService {
  private env: Env

  constructor(env: Env) {
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
   * - Base: 1 point for submitting feedback
   * - +4 points per category detected (teaching, assessment, materials, tips)
   * - +3 bonus points if ALL 4 categories are mentioned
   * - Maximum: 1 + (4×4) + 3 = 20 points
   *
   * @param analysis - The analysis result from analyzeComment
   * @returns Number of points to award (1-20)
   */
  calculateFeedbackPoints(analysis: AnalysisResult): number {
    const categoryCount =
      (analysis.hasTeaching ? 1 : 0) +
      (analysis.hasAssessment ? 1 : 0) +
      (analysis.hasMaterials ? 1 : 0) +
      (analysis.hasTips ? 1 : 0)

    let points = 1 + categoryCount * 4
    if (categoryCount === 4) {
      points += 3
    }
    return points
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
   * Automatically gives 0 points if the feedback is not approved.
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
    // Check if feedback is approved
    const [feedbackRecord] = await database()
      .select({ approvedAt: feedback.approvedAt })
      .from(feedback)
      .where(eq(feedback.id, feedbackId))
      .limit(1)

    // If feedback is not approved, give 0 points
    const isApproved = feedbackRecord?.approvedAt !== null
    const points = isApproved ? this.calculateFeedbackPoints(newAnalysis) : 0

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
   * Calculate points to award for a referral.
   *
   * Flat +15 points per successful referral, uncapped.
   *
   * @param _referralCount - Current number of referrals (before this one); kept
   *   for call-site compatibility, no longer affects the amount.
   * @returns Number of points to award for this referral
   */
  calculateReferralPoints(_referralCount: number): number {
    return REFERRAL_POINTS
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
   * Check if a referred user (referee) has already been awarded their
   * referral-acceptance bonus for a given referrer. Prevents duplicate awards.
   *
   * @param refereeId - The referred user's ID
   * @param referrerId - The referrer's user ID (stored as referenceId)
   * @returns True if the referee bonus has already been awarded
   */
  async hasReceivedReferralBonus(refereeId: number): Promise<boolean> {
    const result = await database()
      .select({ count: count() })
      .from(pointRegistry)
      .where(
        and(
          eq(pointRegistry.userId, refereeId),
          eq(pointRegistry.sourceType, 'referral_bonus')
        )
      )

    return (result[0]?.count || 0) > 0
  }

  /**
   * Award points to a user for accepting a referral (the referee), once they
   * submit their first approved feedback. Mirrors {@link awardReferralPoints}
   * so both sides of a successful referral are credited equally.
   *
   * @param refereeId - The referred user being rewarded
   * @param referrerId - The user who referred them (stored as referenceId)
   * @param points - Number of points to award
   */
  async awardReferralBonusPoints(
    refereeId: number,
    referrerId: number,
    points: number
  ): Promise<void> {
    await database().insert(pointRegistry).values({
      userId: refereeId,
      amount: points,
      sourceType: 'referral_bonus',
      comment: `Referral bonus for accepting an invite`
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

  /**
   * Analyze feedback and award points if not already done.
   * This is used when linking existing feedback to a newly created user account.
   * Only awards points if the feedback is approved.
   *
   * @param feedbackId - The feedback ID to process
   * @param userId - The user who owns this feedback
   * @returns Number of points awarded (0 if already processed, no comment, or not approved)
   */
  async analyzeAndAwardPointsForFeedback(
    feedbackId: number,
    userId: number
  ): Promise<number> {
    // Step 1: Get feedback and check if it's approved
    const [feedbackRecord] = await database()
      .select({
        comment: feedback.comment,
        approvedAt: feedback.approvedAt
      })
      .from(feedback)
      .where(eq(feedback.id, feedbackId))
      .limit(1)

    if (!feedbackRecord) {
      return 0
    }

    // If feedback is not approved, give 0 points
    const isApproved = feedbackRecord.approvedAt !== null
    if (!isApproved) {
      return 0
    }

    // Step 2: Get analysis
    let analysisRecords = await database()
      .select()
      .from(feedbackAnalysis)
      .where(eq(feedbackAnalysis.feedbackId, feedbackId))
      .limit(1)

    // Step 3: If analysis doesn't exist, create one
    if (analysisRecords.length === 0) {
      const comment = feedbackRecord.comment

      let analysisResult: AnalysisResult

      // If no comment, create empty analysis
      if (!comment) {
        analysisResult = {
          hasTeaching: false,
          hasAssessment: false,
          hasMaterials: false,
          hasTips: false,
          wordCount: 0
        }
      } else {
        // Analyze the comment with AI or conservative defaults
        const aiService = new AIService(this.env)
        try {
          const categories = await aiService.categorizeFeedback(comment)
          const wordCount = countWords(comment)
          analysisResult = { ...categories, wordCount }
        } catch (aiError) {
          console.warn(
            'AI categorization failed, using conservative defaults:',
            aiError
          )
          analysisResult = {
            hasTeaching: false,
            hasAssessment: false,
            hasMaterials: false,
            hasTips: false,
            wordCount: countWords(comment)
          }
        }
      }

      // Insert analysis
      await database()
        .insert(feedbackAnalysis)
        .values({
          feedbackId,
          ...analysisResult
        })

      // Fetch the newly created analysis
      analysisRecords = await database()
        .select()
        .from(feedbackAnalysis)
        .where(eq(feedbackAnalysis.feedbackId, feedbackId))
        .limit(1)
    }

    // Step 4: Now analysis exists for sure
    if (analysisRecords.length === 0) {
      // This should never happen, but handle it gracefully
      console.error(
        `Failed to create or fetch analysis for feedback ${feedbackId}`
      )
      return 0
    }

    const analysis = analysisRecords[0]

    // Step 5: Check if points were already awarded
    const existingPoints = await this.getPointsForEntry(
      userId,
      'submit_feedback',
      feedbackId
    )

    // If points already awarded, nothing to do
    if (existingPoints !== null) {
      return 0
    }

    // Calculate and award points
    const points = this.calculateFeedbackPoints(analysis)
    if (points > 0) {
      await this.awardFeedbackPoints(userId, feedbackId, points)
    }

    return points
  }

  /**
   * Check if user has a referrer and award referral points if applicable.
   * This is called when a user submits feedback or when a new user account is created.
   *
   * When the conditions below are met, BOTH sides of the referral are credited
   * the same amount: the referrer (via 'referral') and the referee who accepted
   * the invite (via 'referral_bonus'). Each side is awarded idempotently.
   *
   * Conditions for awarding points (all must be true):
   * - User must have submitted at least one feedback
   * - User must have a referrer (referredByUserId set)
   * - Points must not have been awarded already (per side)
   *
   * @param userId - The referred user (referee) to check for eligibility
   * @returns Whether the referee (this user) was just awarded their
   *   invite-acceptance bonus on this call, and the amount. This lets the
   *   feedback-submission flow surface "you earned +N for being invited" on the
   *   referee's first feedback. `refereeBonusPoints` is 0 when nothing was
   *   awarded (no referrer, no feedback yet, or already credited).
   */
  async checkAndAwardReferralPoints(
    userId: number
  ): Promise<{ refereeBonusAwarded: boolean; refereeBonusPoints: number }> {
    const nothingAwarded = { refereeBonusAwarded: false, refereeBonusPoints: 0 }

    // 1. Get user's referrer
    const [user] = await database()
      .select({ referredByUserId: users.referredByUserId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    // No referrer? No points to award
    if (!user?.referredByUserId) {
      return nothingAwarded
    }
    const referrerId = user.referredByUserId

    // 2. Check if user has submitted any feedback
    const feedbackCount = await database()
      .select({ count: count() })
      .from(feedback)
      .where(eq(feedback.userId, userId))

    if ((feedbackCount[0]?.count || 0) === 0) {
      return nothingAwarded
    }

    // Both sides earn the same amount. Compute once from the referrer's count.
    const referralCount = await this.getReferralCount(referrerId)
    const referralPoints = this.calculateReferralPoints(referralCount)

    // 3. Award the referrer (idempotent)
    const referrerAlreadyAwarded = await this.hasReceivedReferralPointsFor(
      referrerId,
      userId
    )
    if (!referrerAlreadyAwarded) {
      await this.awardReferralPoints(referrerId, userId, referralPoints)
    }

    // 4. Award the referee for accepting the invite (idempotent)
    const refereeAlreadyAwarded = await this.hasReceivedReferralBonus(userId)
    if (!refereeAlreadyAwarded) {
      await this.awardReferralBonusPoints(userId, referrerId, referralPoints)
      return { refereeBonusAwarded: true, refereeBonusPoints: referralPoints }
    }

    return nothingAwarded
  }

  /**
   * Award the one-time bonus for linking an Instagram handle.
   * Idempotent: does nothing if the bonus has already been awarded, so editing
   * an already-linked handle won't double-award.
   *
   * @param userId - The user linking their Instagram handle
   */
  async awardInstagramBonus(userId: number): Promise<void> {
    const existing = await this.getPointsForEntry(
      userId,
      'bonus',
      INSTAGRAM_BONUS_REFERENCE_ID
    )
    if (existing !== null) return

    await database().insert(pointRegistry).values({
      userId,
      amount: INSTAGRAM_BONUS_POINTS,
      sourceType: 'bonus',
      referenceId: INSTAGRAM_BONUS_REFERENCE_ID,
      comment: 'Bonus for linking Instagram handle'
    })
  }

  /**
   * Remove the Instagram-link bonus (used when a user unlinks their handle).
   * Deletes the bonus row so re-linking later awards the bonus again.
   *
   * @param userId - The user unlinking their Instagram handle
   */
  async removeInstagramBonus(userId: number): Promise<void> {
    await database()
      .delete(pointRegistry)
      .where(
        and(
          eq(pointRegistry.userId, userId),
          eq(pointRegistry.sourceType, 'bonus'),
          eq(pointRegistry.referenceId, INSTAGRAM_BONUS_REFERENCE_ID)
        )
      )
  }

  /**
   * Count a user's "perfect" feedbacks for a given school year.
   *
   * A feedback is perfect when it is approved, not soft-deleted (the `feedback`
   * view already excludes deleted rows) and its analysis flags all four
   * categories: teaching, assessment, materials and tips.
   *
   * @param userId - The user's ID
   * @param schoolYear - School year as stored in the DB (e.g. 2025 for 2025/2026)
   * @returns Number of perfect feedbacks
   */
  async countPerfectFeedbacks(
    userId: number,
    schoolYear: number
  ): Promise<number> {
    const result = await database()
      .select({ count: count() })
      .from(feedback)
      .innerJoin(feedbackAnalysis, eq(feedbackAnalysis.feedbackId, feedback.id))
      .where(
        and(
          eq(feedback.userId, userId),
          eq(feedback.schoolYear, schoolYear),
          isNotNull(feedback.approvedAt),
          eq(feedbackAnalysis.hasTeaching, true),
          eq(feedbackAnalysis.hasAssessment, true),
          eq(feedbackAnalysis.hasMaterials, true),
          eq(feedbackAnalysis.hasTips, true)
        )
      )

    return result[0]?.count || 0
  }

  /**
   * Idempotently reconcile the perfect-feedback giveaway bonus for a user.
   *
   * Awards a one-time {@link PERFECT_FEEDBACK_BONUS_POINTS}-point bonus once the
   * user reaches {@link PERFECT_FEEDBACK_THRESHOLD} perfect feedbacks for
   * {@link PERFECT_FEEDBACK_BONUS_SCHOOL_YEAR}, and removes it again if they
   * later drop below the threshold (e.g. after editing or deleting a feedback).
   *
   * Eligibility is recomputed from scratch on every call, so this is safe to
   * invoke after any feedback submit / edit / delete / approve / unapprove
   * without double-awarding or leaving a stale bonus.
   *
   * @param userId - The user to reconcile the bonus for
   */
  async reconcilePerfectFeedbackBonus(userId: number): Promise<void> {
    const perfectCount = await this.countPerfectFeedbacks(
      userId,
      PERFECT_FEEDBACK_BONUS_SCHOOL_YEAR
    )
    const isEligible = perfectCount >= PERFECT_FEEDBACK_THRESHOLD

    const existing = await this.getPointsForEntry(
      userId,
      'bonus',
      PERFECT_FEEDBACK_BONUS_SCHOOL_YEAR
    )
    const alreadyAwarded = existing !== null

    if (isEligible && !alreadyAwarded) {
      await database()
        .insert(pointRegistry)
        .values({
          userId,
          amount: PERFECT_FEEDBACK_BONUS_POINTS,
          sourceType: 'bonus',
          referenceId: PERFECT_FEEDBACK_BONUS_SCHOOL_YEAR,
          comment: `Bonus for ${PERFECT_FEEDBACK_THRESHOLD} perfect feedbacks in ${formatSchoolYearString(PERFECT_FEEDBACK_BONUS_SCHOOL_YEAR)}`
        })
    } else if (!isEligible && alreadyAwarded) {
      await database()
        .delete(pointRegistry)
        .where(
          and(
            eq(pointRegistry.userId, userId),
            eq(pointRegistry.sourceType, 'bonus'),
            eq(pointRegistry.referenceId, PERFECT_FEEDBACK_BONUS_SCHOOL_YEAR)
          )
        )
    }
  }
}
