import { useTranslation } from 'react-i18next'
import { CourseReviewsContent, type CourseDetail } from '~/components'
import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'

interface CourseReviewsProps {
  course: CourseDetail
  feedback: CourseFeedback[]
}

export function CourseReviews({ course, feedback }: CourseReviewsProps) {
  const { t } = useTranslation('course')

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        {t('reviews.heading')}
      </h2>
      <CourseReviewsContent
        courseId={course.id}
        feedback={feedback}
        course={course}
      />
    </>
  )
}
