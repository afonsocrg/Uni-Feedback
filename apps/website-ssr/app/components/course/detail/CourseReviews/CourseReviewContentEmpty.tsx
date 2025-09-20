import { Button } from '@uni-feedback/ui'
import { getFullUrl } from '~/utils'
import { AskForFeedback, type CourseDetail } from '~/components'

interface CourseReviewContentEmptyProps {
  reviewFormUrl: string
  courseId: number
  course: CourseDetail
}
export function CourseReviewContentEmpty({
  reviewFormUrl,
  courseId,
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
        <Button asChild>
          <a
            href={reviewFormUrl}
            onClick={(e) => {
              if (typeof window !== 'undefined') {
                // Dynamically import posthog only on client side
                import('posthog-js').then((posthog) => {
                  posthog.default.capture('review_form_open', {
                    source: 'course_detail_page.add_first_review',
                    course_id: courseId
                  })
                })
              }
              // Small delay to ensure PostHog event is sent
              e.preventDefault()
              setTimeout(() => {
                if (typeof window !== 'undefined') {
                  window.location.href = reviewFormUrl
                }
              }, 100)
            }}
          >
            Give Feedback!
          </a>
        </Button>
      </div>
    </div>
  )
}
