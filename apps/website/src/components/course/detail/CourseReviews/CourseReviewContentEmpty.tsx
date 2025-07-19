import { getFullUrl } from '@/utils/routes'
import { Button } from '@ui/button'
import posthog from 'posthog-js'
import { useNavigate } from 'react-router-dom'
import { AskForFeedback } from './AskForFeedback'

interface CourseReviewContentEmptyProps {
  reviewFormUrl: string
  courseId: number
}
export function CourseReviewContentEmpty({
  reviewFormUrl,
  courseId
}: CourseReviewContentEmptyProps) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6 bg-gray-50 rounded-lg">
      <div className="text-5xl">💬</div>
      <div>
        <h3 className="text-xl font-semibold mb-2">
          No reviews yet for this course
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Be the first to share your experience, or invite your friends to leave
          feedback! Your input helps future students make better choices.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <AskForFeedback
          reviewFormUrl={getFullUrl(reviewFormUrl)}
          courseId={courseId}
        />
        <Button
          onClick={() => {
            posthog.capture('review_form_open', {
              source: 'course_detail_page.add_first_review',
              course_id: courseId
            })
            navigate(reviewFormUrl)
          }}
        >
          Give Feedback!
        </Button>
      </div>
    </div>
  )
}
