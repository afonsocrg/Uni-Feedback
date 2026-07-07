/**
 * Feedback points scoring.
 *
 * Single source of truth for how many points a feedback submission is worth.
 * Shared between the API (which awards the authoritative amount in
 * `PointService`) and the website (which shows a live "points you'll earn"
 * preview on the feedback form). Keep the formula here so the preview can never
 * drift from what actually gets awarded.
 */

/** The four content categories a feedback comment can cover. */
export interface FeedbackCategoryFlags {
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
}

/** Base points, awarded just for submitting a feedback. */
export const FEEDBACK_BASE_POINTS = 1

/** Points earned per content category detected in the comment. */
export const FEEDBACK_POINTS_PER_CATEGORY = 4

/** Extra bonus awarded when all categories are covered. */
export const FEEDBACK_ALL_CATEGORIES_BONUS = 3

/** Total number of content categories. */
export const FEEDBACK_CATEGORY_COUNT = 4

/** Maximum points a single feedback can earn: 1 + 4×4 + 3 = 20. */
export const MAX_FEEDBACK_POINTS =
  FEEDBACK_BASE_POINTS +
  FEEDBACK_CATEGORY_COUNT * FEEDBACK_POINTS_PER_CATEGORY +
  FEEDBACK_ALL_CATEGORIES_BONUS

/** Count how many content categories a feedback covers. */
export function countFeedbackCategories(flags: FeedbackCategoryFlags): number {
  return (
    (flags.hasTeaching ? 1 : 0) +
    (flags.hasAssessment ? 1 : 0) +
    (flags.hasMaterials ? 1 : 0) +
    (flags.hasTips ? 1 : 0)
  )
}

/**
 * Points awarded for a feedback submission, from its detected categories.
 *
 * Rules:
 * - Base: {@link FEEDBACK_BASE_POINTS} for submitting
 * - +{@link FEEDBACK_POINTS_PER_CATEGORY} per category covered
 * - +{@link FEEDBACK_ALL_CATEGORIES_BONUS} when all categories are covered
 * - Range: {@link FEEDBACK_BASE_POINTS}–{@link MAX_FEEDBACK_POINTS} (1–20)
 */
export function calculateFeedbackPoints(flags: FeedbackCategoryFlags): number {
  const categoryCount = countFeedbackCategories(flags)
  let points =
    FEEDBACK_BASE_POINTS + categoryCount * FEEDBACK_POINTS_PER_CATEGORY
  if (categoryCount === FEEDBACK_CATEGORY_COUNT) {
    points += FEEDBACK_ALL_CATEGORIES_BONUS
  }
  return points
}
