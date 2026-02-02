import type { Feedback } from '@uni-feedback/db/schema'
import { Button } from '@uni-feedback/ui'
import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  AskForFeedback,
  CourseReviewsContent,
  type CourseDetail
} from '~/components'
import { analytics, getPageName } from '~/utils/analytics'
import { getFullUrl } from '~/utils'

interface CourseReviewsProps {
  course: CourseDetail
  feedback: Feedback[]
}

export function CourseReviews({ course, feedback }: CourseReviewsProps) {
  const reviewFormUrl = useMemo(() => {
    return `/feedback/new?courseId=${course.id}`
  }, [course.id])

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Student Feedback
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
                Give Feedback!
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
