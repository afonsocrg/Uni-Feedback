import { Chip } from '@uni-feedback/ui'
import { formatSchoolYearString } from '@uni-feedback/utils'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CoursePageFeedbackCard } from '~/components'
import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'
import { cn } from '~/utils'
import { analytics } from '~/utils/analytics'
import { splitYearFeedback } from './splitYearFeedback'

interface SchoolYearSectionProps {
  courseId: number
  schoolYear: number
  feedback: CourseFeedback[]
  /**
   * When false, rating-only feedback is rendered inline (still after the
   * commented feedback) instead of behind the toggle. The course has no
   * commented feedback at all, so collapsing would leave the page with
   * nothing to read.
   */
  collapseRatingsOnly?: boolean
  /**
   * How many of the cards shown by default stay visible; the rest are rendered
   * hidden (still in the HTML, for search engines) and so is the rating-only
   * toggle. Unset shows the whole year. See `CourseReviewsContent`.
   */
  visibleCount?: number
}

const firstMEPPYear = 2021
export function SchoolYearSection({
  courseId,
  schoolYear,
  feedback,
  collapseRatingsOnly = true,
  visibleCount
}: SchoolYearSectionProps) {
  const { t } = useTranslation('course')
  const [isExpanded, setIsExpanded] = useState(false)

  const { ratingsOnly, shouldCollapse, shownByDefault } = splitYearFeedback(
    feedback,
    collapseRatingsOnly
  )
  const isTruncated =
    visibleCount !== undefined && visibleCount < shownByDefault.length

  // Permalinks to rating-only feedback predate this collapse, and the card can
  // only scroll itself into view once it is mounted.
  useEffect(() => {
    const targetId = window.location.hash.replace('#feedback-', '')
    if (targetId && ratingsOnly.some((f) => String(f.id) === targetId)) {
      setIsExpanded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = () => {
    const expanded = !isExpanded
    setIsExpanded(expanded)
    analytics.feedback.ratingsOnlyToggled({
      courseId,
      schoolYear,
      count: ratingsOnly.length,
      expanded
    })
  }

  return (
    <div className="mb-8">
      <div className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
        {formatSchoolYearString(schoolYear, { yearFormat: 'long' })}
        {schoolYear < firstMEPPYear && (
          <Chip label={t('reviews.pre_mepp')} color="amber" />
        )}
      </div>
      <div className="space-y-4">
        {/* Rating-only cards are in `shownByDefault` only when they are not
            behind the toggle, so they count against `visibleCount` after the
            commented ones, in render order. */}
        {shownByDefault.map((f, index) => {
          const hidden = isTruncated && index >= visibleCount
          return (
            // Keyed on `hidden` so a card remounts when revealed: its
            // permalink effect can only scroll to it once it is displayed.
            <div key={`${f.id}:${hidden}`} className={cn(hidden && 'hidden')}>
              <CoursePageFeedbackCard feedback={f} />
            </div>
          )
        })}

        {/* Kept above the expanded cards so the button does not move when clicked. */}
        {shouldCollapse && !isTruncated && (
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2',
              'text-sm font-medium text-muted-foreground',
              'hover:text-foreground transition-colors cursor-pointer'
            )}
          >
            {isExpanded
              ? t('reviews.ratings_only_hide')
              : t('reviews.ratings_only_show', { count: ratingsOnly.length })}
            <ChevronDown
              className={cn(
                'size-4 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          </button>
        )}

        {shouldCollapse &&
          isExpanded &&
          ratingsOnly.map((f) => (
            <CoursePageFeedbackCard key={f.id} feedback={f} />
          ))}
      </div>
    </div>
  )
}
