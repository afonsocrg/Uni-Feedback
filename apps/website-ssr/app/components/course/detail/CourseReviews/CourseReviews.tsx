import type { Feedback } from '@uni-feedback/db/schema'
import { Button } from '@uni-feedback/ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  AskForFeedback,
  CourseReviewsContent,
  type CourseDetail
} from '~/components'
import { getFullUrl } from '~/utils'
import { analytics, getPageName } from '~/utils/analytics'

interface CourseReviewsProps {
  course: CourseDetail
  feedback: Feedback[]
}

export function CourseReviews({ course, feedback }: CourseReviewsProps) {
  const { t } = useTranslation('course')
  const reviewFormUrl = useMemo(() => {
    return `/courses/${course.id}/feedback?from=course_reviews`
  }, [course.id])

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {t('reviews.heading')}
        </h2>
        {feedback && feedback.length > 0 && (
          <div className="flex gap-3">
            <AskForFeedback
              reviewFormUrl={getFullUrl(reviewFormUrl)}
              course={course}
            />
            <Button asChild className="text-white">
              <Link
                to={reviewFormUrl}
                onClick={() => {
                  analytics.navigation.feedbackFormLinkClicked({
                    source: 'course_page_cta',
                    referrerPage: getPageName(window.location.pathname),
                    courseId: course.id
                  })
                }}
              >
                {t('reviews.give_feedback')}
              </Link>
            </Button>
          </div>
        )}
      </div>
      <CourseReviewsContent
        courseId={course.id}
        feedback={feedback}
        course={course}
      />
    </>
  )
}
