import { Button } from '@uni-feedback/ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  AskForFeedback,
  CourseReviewsContent,
  type CourseDetail
} from '~/components'
import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'
import { useLang } from '~/hooks'
import { getFullUrl } from '~/utils'
import { analytics, getPageName } from '~/utils/analytics'
import { getCourseFeedbackPath } from '~/utils/i18n-routes'

interface CourseReviewsProps {
  course: CourseDetail
  feedback: CourseFeedback[]
}

export function CourseReviews({ course, feedback }: CourseReviewsProps) {
  const { t } = useTranslation('course')
  const lang = useLang()
  const reviewFormUrl = useMemo(() => {
    return `${getCourseFeedbackPath(lang, course.id)}?from=course_reviews`
  }, [lang, course.id])

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-foreground">
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
