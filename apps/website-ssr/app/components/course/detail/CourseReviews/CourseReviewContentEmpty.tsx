import { Button } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AskForFeedback, type CourseDetail } from '~/components'
import { getFullUrl } from '~/utils'
import { analytics, getPageName } from '~/utils/analytics'

interface CourseReviewContentEmptyProps {
  reviewFormUrl: string
  courseId: number
  course: CourseDetail
}
export function CourseReviewContentEmpty({
  reviewFormUrl,
  course
}: CourseReviewContentEmptyProps) {
  const { t } = useTranslation('course')
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6 rounded-lg">
      <div className="text-5xl">💬</div>
      <div>
        <h3 className="text-xl font-semibold mb-2">
          {t('reviews.empty_heading')}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {t('reviews.empty_desc')}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <AskForFeedback
          reviewFormUrl={getFullUrl(reviewFormUrl)}
          course={course}
        />
        <Button asChild className="text-white">
          <Link
            to={reviewFormUrl}
            onClick={() => {
              analytics.navigation.feedbackFormLinkClicked({
                source: 'course_page_empty_state',
                referrerPage: getPageName(window.location.pathname),
                courseId: course.id
              })
            }}
          >
            {t('reviews.give_feedback')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
