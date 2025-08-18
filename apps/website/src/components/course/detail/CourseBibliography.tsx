import { EditableSection } from '@components'
import { getBibliographyFormUrl } from '@services/googleForms'
import { type CourseDetail } from '@services/meicFeedbackAPI'
import { Markdown } from '@uni-feedback/ui'

interface CourseDescriptionProps {
  course: CourseDetail
}
export function CourseBiblioraphy({ course }: CourseDescriptionProps) {
  return (
    <EditableSection
      title="Bibliography"
      value={course.bibliography}
      editTooltip="Edit bibliography"
      getEditUrl={() => getBibliographyFormUrl(course)}
      renderContent={(value) => <Markdown>{value}</Markdown>}
      fallback={
        <p className="text-gray-600 italic">
          We don't have a bibliography for this course yet.{' '}
          <a
            href={getBibliographyFormUrl(course)}
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
