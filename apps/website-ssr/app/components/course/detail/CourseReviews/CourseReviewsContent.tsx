import { CourseReviewContentEmpty, SchoolYearSection } from '~/components'
// import { useCourseFeedback } from '@hooks'
import { WarningAlert } from '@uni-feedback/ui'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CourseDetail } from '~/components'
import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'

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
  const reviewFormUrl = useMemo(() => {
    return `/courses/${courseId}/feedback?from=course_reviews`
  }, [courseId])

  const groupedFeedback = useMemo(() => {
    if (!feedback) return []
    return Array.from(groupReviewsBySchoolYear(feedback).entries()).sort(
      ([yearA], [yearB]) => yearB - yearA
    )
  }, [feedback])

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

        return (
          <div key={schoolYear}>
            {isFirstOutdated && (
              <WarningAlert message={t('reviews.outdated_warning')} />
            )}
            <SchoolYearSection
              schoolYear={schoolYear}
              feedback={yearFeedback}
            />
          </div>
        )
      })}
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
