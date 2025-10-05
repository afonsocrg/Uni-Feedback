import type { Feedback } from '@uni-feedback/db/schema'
import { Button } from '@uni-feedback/ui'
import posthog from 'posthog-js'
import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  AskForFeedback,
  CourseReviewsContent,
  type CourseDetail
} from '~/components'
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
                  posthog.capture('review_form_open', {
                    source: 'course_detail_page.add_review',
                    course_id: course.id
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
