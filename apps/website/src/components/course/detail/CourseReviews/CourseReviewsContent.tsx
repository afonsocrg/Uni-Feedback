import {
  CourseReviewContentEmpty,
  CourseReviewsSkeleton,
  SchoolYearSection,
  WarningAlert
} from '@components'
import { useCourseFeedback } from '@hooks'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { type Feedback } from '@services/meicFeedbackAPI'
import { useMemo } from 'react'

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300 }
  }
}

interface CourseReviewsContentProps {
  courseId: number
}
export function CourseReviewsContent({ courseId }: CourseReviewsContentProps) {
  const {
    data: feedback,
    isLoading: isLoadingFeedback,
    isError: isErrorFeedback
  } = useCourseFeedback(courseId)
  const reviewFormUrl = useMemo(() => {
    return `/feedback/new?courseId=${courseId}`
  }, [courseId])

  const groupedFeedback = useMemo(() => {
    if (!feedback) return []
    return Array.from(groupReviewsBySchoolYear(feedback).entries()).sort(
      ([yearA], [yearB]) => yearB - yearA
    )
  }, [feedback])

  if (isLoadingFeedback || isErrorFeedback || !feedback) {
    return <CourseReviewsSkeleton />
  }

  if (feedback.length === 0) {
    return (
      <CourseReviewContentEmpty
        courseId={courseId}
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
              <WarningAlert message="The reviews below this point may be outdated. Course content, teaching methods, and requirements may have changed since then." />
            )}
            <SchoolYearSection
              schoolYear={schoolYear}
              feedback={yearFeedback}
              variants={itemVariants}
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
  reviews: Feedback[]
): Map<number, Feedback[]> => {
  const grouped = new Map<number, Feedback[]>()

  reviews.forEach((f) => {
    const schoolYear = f.schoolYear
    if (!grouped.has(schoolYear)) {
      grouped.set(schoolYear, [])
    }
    grouped.get(schoolYear)?.push(f)
  })

  return grouped
}
