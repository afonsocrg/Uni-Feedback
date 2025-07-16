import { EditableSection, Markdown } from '@components'
import { getAssessmentFormUrl } from '@services/googleForms'
import { type CourseDetail } from '@services/meicFeedbackAPI'

export interface CourseAssessmentProps {
  course: CourseDetail
}
export function CourseAssessment({ course }: CourseAssessmentProps) {
  return (
    <EditableSection
      title="Assessment"
      value={course.assessment}
      editTooltip="Edit assessment"
      getEditUrl={() => getAssessmentFormUrl(course)}
      renderContent={(value) => <Markdown>{value}</Markdown>}
      fallback={
        <p className="text-gray-600 italic">
          No assessment yet.{' '}
          <a
            href={getAssessmentFormUrl(course)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primaryBlue underline hover:no-underline"
          >
            Be the first to add one!
          </a>
        </p>
      }
    />
  )
}
