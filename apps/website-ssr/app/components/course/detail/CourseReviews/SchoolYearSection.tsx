import type { Feedback } from '@uni-feedback/db/schema'
import { Chip } from '@uni-feedback/ui'
import { formatSchoolYearString } from '@uni-feedback/utils'
import { CoursePageFeedbackCard } from '~/components'

interface SchoolYearSectionProps {
  schoolYear: number
  feedback: Feedback[]
}

const firstMEPPYear = 2021

export function SchoolYearSection({
  schoolYear,
  feedback
}: SchoolYearSectionProps) {
  return (
    <div className="mb-8">
      <div className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
        {formatSchoolYearString(schoolYear, { yearFormat: 'long' })}
        {schoolYear < firstMEPPYear && <Chip label="Pre-MEPP" color="amber" />}
      </div>
      <div className="space-y-4">
        {feedback.map((f) => (
          <CoursePageFeedbackCard key={f.id} feedback={f} />
        ))}
      </div>
    </div>
  )
}
