import { CourseReviewContentEmpty, SchoolYearSection } from '~/components'
// import { useCourseFeedback } from '@hooks'
import { WarningAlert } from '@uni-feedback/ui'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CourseDetail } from '~/components'
import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'
import { useLang } from '~/hooks'
import { hasText } from '~/lib/textUtils'
import { cn } from '~/utils'
import { analytics } from '~/utils/analytics'
import { getCourseFeedbackPath } from '~/utils/i18n-routes'
import { splitYearFeedback } from './splitYearFeedback'

/**
 * Cards shown before "Ver todo o feedback". Without it, a course with 20+
 * written feedbacks buried its other sections: from 11 feedbacks up, a quarter
 * or fewer of the views reached the description (2026-11, by
 * `course_section_viewed`). Counted across school years, newest first.
 */
const feedbackPreviewLimit = 7

interface CourseReviewsContentProps {
  courseId: number
  course: CourseDetail
  feedback: CourseFeedback[]
}
export function CourseReviewsContent({
  course,
  courseId,
  feedback
}: CourseReviewsContentProps) {
  const { t } = useTranslation('course')
  const lang = useLang()
  const reviewFormUrl = useMemo(() => {
    return getCourseFeedbackPath(lang, courseId, 'course_reviews')
  }, [lang, courseId])

  const groupedFeedback = useMemo(() => {
    if (!feedback) return []
    return Array.from(groupReviewsBySchoolYear(feedback).entries()).sort(
      ([yearA], [yearB]) => yearB - yearA
    )
  }, [feedback])

  // Decided across the whole course, not per school year: collapsing every year
  // independently would leave the page empty for courses where nobody commented.
  const collapseRatingsOnly = useMemo(
    () => feedback.some((f) => hasText(f.comment)),
    [feedback]
  )

  // How many of each year's cards fit in the preview: undefined for a whole
  // year, a count for the year the limit falls in, 0 for the years after it.
  const preview = useMemo(() => {
    let remaining = feedbackPreviewLimit
    let shownCount = 0
    // Feedback a permalink can reach without opening the list: the preview's
    // cards, plus the rating-only ones behind a whole year's own toggle
    const reachableIds = new Set<number>()
    const visibleCounts = groupedFeedback.map(([, yearFeedback]) => {
      const { shownByDefault } = splitYearFeedback(
        yearFeedback,
        collapseRatingsOnly
      )
      if (remaining > 0 && shownByDefault.length <= remaining) {
        yearFeedback.forEach((f) => reachableIds.add(f.id))
        remaining -= shownByDefault.length
        shownCount += shownByDefault.length
        return undefined
      }
      const count = remaining
      shownByDefault.slice(0, count).forEach((f) => reachableIds.add(f.id))
      remaining = 0
      shownCount += count
      return count
    })
    return {
      visibleCounts,
      reachableIds,
      shownCount,
      isTruncated: visibleCounts.some((count) => count !== undefined)
    }
  }, [groupedFeedback, collapseRatingsOnly])

  const [isExpanded, setIsExpanded] = useState(false)
  const truncated = preview.isTruncated && !isExpanded

  // A permalink to a feedback past the preview opens the whole list. The card
  // remounts when revealed and scrolls itself into view.
  useEffect(() => {
    const targetId = window.location.hash.replace('#feedback-', '')
    if (
      targetId &&
      feedback.some((f) => String(f.id) === targetId) &&
      !preview.reachableIds.has(Number(targetId))
    ) {
      setIsExpanded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { shownCount } = preview
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const moreButtonSeen = useRef(false)

  // The expand rate's denominator: the button scrolled into view, once per
  // page view. Same "past the bottom quarter" rule as the landing sections.
  useEffect(() => {
    const el = moreButtonRef.current
    if (!el || !truncated || moreButtonSeen.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || moreButtonSeen.current) return
        moreButtonSeen.current = true
        analytics.course.feedbackMoreViewed({
          courseId,
          shownCount,
          totalCount: feedback.length
        })
        observer.disconnect()
      },
      { rootMargin: '0px 0px -25% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [truncated, courseId, shownCount, feedback.length])

  const handleExpand = () => {
    setIsExpanded(true)
    analytics.course.feedbackExpanded({
      courseId,
      shownCount,
      totalCount: feedback.length
    })
  }

  if (feedback.length === 0) {
    return (
      <CourseReviewContentEmpty
        courseId={courseId}
        course={course}
        reviewFormUrl={reviewFormUrl}
      />
    )
  }

  return (
    <div className="space-y-4">
      {groupedFeedback.map(([schoolYear, yearFeedback], index, array) => {
        const isOutdated = isSchoolYearOutdated(schoolYear)
        const isFirstOutdated =
          isOutdated &&
          (index === 0 || !isSchoolYearOutdated(array[index - 1][0]))

        const visibleCount = truncated
          ? preview.visibleCounts[index]
          : undefined

        return (
          <div key={schoolYear} className={cn(visibleCount === 0 && 'hidden')}>
            {isFirstOutdated && (
              <WarningAlert message={t('reviews.outdated_warning')} />
            )}
            <SchoolYearSection
              courseId={courseId}
              schoolYear={schoolYear}
              feedback={yearFeedback}
              collapseRatingsOnly={collapseRatingsOnly}
              visibleCount={visibleCount}
            />
          </div>
        )
      })}

      {truncated && (
        <div className="flex justify-center">
          <button
            ref={moreButtonRef}
            type="button"
            onClick={handleExpand}
            className={cn(
              'flex items-center gap-2 rounded-full border border-border px-5 py-2',
              'text-sm font-medium text-foreground',
              'hover:bg-muted transition-colors cursor-pointer'
            )}
          >
            {t('reviews.show_all_feedback', { count: feedback.length })}
            <ChevronDown className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function isSchoolYearOutdated(schoolYear: number) {
  const currentSchoolYear = getCurrentSchoolYear()

  // A school year is outdated if it's more than 2 years behind the current one
  return schoolYear < currentSchoolYear - 2
}

// Helper function to group feedback by school year
const groupReviewsBySchoolYear = (
  reviews: CourseFeedback[]
): Map<number, CourseFeedback[]> => {
  const grouped = new Map<number, CourseFeedback[]>()

  reviews.forEach((f) => {
    if (!f.schoolYear) return
    if (!grouped.has(f.schoolYear)) {
      grouped.set(f.schoolYear, [])
    }
    grouped.get(f.schoolYear)?.push(f)
  })

  return grouped
}
