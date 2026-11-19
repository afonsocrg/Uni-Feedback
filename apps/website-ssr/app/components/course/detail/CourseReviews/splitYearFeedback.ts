import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'
import { hasText } from '~/lib/textUtils'

// A year with only a handful of rating-only feedbacks shows them inline: a
// toggle hiding two or three cards costs more attention than the cards do.
const ratingsOnlyCollapseThreshold = 5

/**
 * Splits a year's feedback the way it is rendered: commented first, then
 * rating-only, which go behind a toggle when there are many of them.
 * `shownByDefault` is what renders before any toggle is clicked.
 */
export function splitYearFeedback(
  feedback: CourseFeedback[],
  collapseRatingsOnly = true
) {
  const commented = feedback.filter((f) => hasText(f.comment))
  const ratingsOnly = feedback.filter((f) => !hasText(f.comment))
  const shouldCollapse =
    collapseRatingsOnly && ratingsOnly.length > ratingsOnlyCollapseThreshold
  const shownByDefault = shouldCollapse
    ? commented
    : [...commented, ...ratingsOnly]
  return { commented, ratingsOnly, shouldCollapse, shownByDefault }
}
