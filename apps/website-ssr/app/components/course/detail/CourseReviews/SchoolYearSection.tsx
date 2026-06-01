import { Chip } from '@uni-feedback/ui'
import { formatSchoolYearString } from '@uni-feedback/utils'
import { useTranslation } from 'react-i18next'
import { CoursePageFeedbackCard } from '~/components'
import type { CourseFeedback } from '~/components/feedback/cards/CoursePageFeedbackCard'

interface SchoolYearSectionProps {
  schoolYear: number
  feedback: CourseFeedback[]
}

const firstMEPPYear = 2021

export function SchoolYearSection({
  schoolYear,
  feedback
}: SchoolYearSectionProps) {
  const { t } = useTranslation('course')
  return (
    <div className="mb-8">
      <div className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
        {formatSchoolYearString(schoolYear, { yearFormat: 'long' })}
        {schoolYear < firstMEPPYear && (
          <Chip label={t('reviews.pre_mepp')} color="amber" />
        )}
      </div>
      <div className="space-y-4">
        {feedback.map((f) => (
          <CoursePageFeedbackCard key={f.id} feedback={f} />
        ))}
      </div>
    </div>
  )
}
