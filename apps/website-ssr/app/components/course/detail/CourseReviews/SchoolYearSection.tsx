import type { Feedback } from '@uni-feedback/db/schema'
import { Chip } from '@uni-feedback/ui'
import { formatSchoolYearString } from '@uni-feedback/utils'
import { FeedbackItem } from '~/components'

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
    <div>
      <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        {formatSchoolYearString(schoolYear, { yearFormat: 'long' })}
        {schoolYear < firstMEPPYear && <Chip label="Pre-MEPP" color="amber" />}
      </div>
      {feedback.map((f) => (
        <FeedbackItem key={f.id} feedback={f} />
      ))}
    </div>
  )
}
