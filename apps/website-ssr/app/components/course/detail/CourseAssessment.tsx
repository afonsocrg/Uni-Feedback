import { Markdown } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'

interface CourseAssessmentProps {
  course: {
    assessment?: string | null
  }
}

export function CourseAssessment({ course }: CourseAssessmentProps) {
  const { t } = useTranslation('course')
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          {t('tabs.assessment')}
        </h2>
      </div>
      {course.assessment ? (
        <Markdown>{course.assessment}</Markdown>
      ) : (
        <p className="text-gray-600 italic">{t('assessment.no_content')}</p>
      )}
    </div>
  )
}
