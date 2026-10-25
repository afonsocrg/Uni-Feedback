import { useTranslation } from 'react-i18next'
import { CourseReviewsContent, type CourseDetail } from '~/components'
import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'
import { SectionShell } from '../../../degree/DegreeSections'
import { COURSE_SECTION_IDS } from '../courseContentFields'

interface CourseReviewsProps {
  course: CourseDetail
  feedback: CourseFeedback[]
}

export function CourseReviews({ course, feedback }: CourseReviewsProps) {
  const { t } = useTranslation('course')

  return (
    <SectionShell
      id={COURSE_SECTION_IDS.feedback}
      title={t('sections.feedback')}
    >
      <CourseReviewsContent
        courseId={course.id}
        feedback={feedback}
        course={course}
      />
    </SectionShell>
  )
}
