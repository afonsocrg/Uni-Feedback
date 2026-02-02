import { Button } from '@uni-feedback/ui'
import { Link } from 'react-router'
import { AskForFeedback, type CourseDetail } from '~/components'
import { analytics, getPageName } from '~/utils/analytics'
import { getFullUrl } from '~/utils'

interface CourseReviewContentEmptyProps {
  reviewFormUrl: string
  courseId: number
  course: CourseDetail
}
export function CourseReviewContentEmpty({
  reviewFormUrl,
  course
}: CourseReviewContentEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6 rounded-lg">
      <div className="text-5xl">💬</div>
      <div>
        <h3 className="text-xl font-semibold mb-2">
          No feedback for this course yet
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Be the first to share your experience, or ask your friends to leave
          feedback! Your input helps future students make better choices.
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
            Give Feedback!
          </Link>
        </Button>
      </div>
    </div>
  )
}
