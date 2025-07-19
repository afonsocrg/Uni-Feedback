import { getFullUrl } from '@/utils/routes'
import { CourseReviewsContent } from '@components'
import { useCourseFeedback } from '@hooks'
import { Button } from '@ui/button'
import posthog from 'posthog-js'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AskForFeedback } from './AskForFeedback'

export interface CourseReviewsProps {
  courseId: number
}
export function CourseReviews({ courseId }: CourseReviewsProps) {
  const navigate = useNavigate()

  const reviewFormUrl = useMemo(() => {
    return `/feedback/new?courseId=${courseId}`
  }, [courseId])
  const { data: feedback } = useCourseFeedback(courseId)

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Student Reviews
        </h2>
        {feedback && feedback.length > 0 && (
          <div className="flex gap-3">
            <AskForFeedback
              reviewFormUrl={getFullUrl(reviewFormUrl)}
              courseId={courseId}
            />
            <Button
              onClick={() => {
                posthog.capture('review_form_open', {
                  source: 'course_detail_page.add_review',
                  course_id: courseId
                })
                navigate(reviewFormUrl)
              }}
            >
              Give Feedback!
            </Button>
          </div>
        )}
      </div>
      <CourseReviewsContent courseId={courseId} />
    </>
  )
}
