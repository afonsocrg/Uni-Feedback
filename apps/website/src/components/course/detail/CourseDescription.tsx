import { EditableSection } from '@components'
import { getEditDescriptionFormUrl } from '@services/googleForms'
import { type CourseDetail } from '@services/meicFeedbackAPI'
import { Markdown } from '@uni-feedback/ui'

interface CourseDescriptionProps {
  course: CourseDetail
}
export function CourseDescription({ course }: CourseDescriptionProps) {
  return (
    <EditableSection
      title="What's this course really about?"
      value={course.description}
      editTooltip="Edit description"
      getEditUrl={() => getEditDescriptionFormUrl(course)}
      renderContent={(value) => <Markdown>{value}</Markdown>}
      fallback={
        <p className="text-gray-600 italic">
          We don't have a description for this course yet.{' '}
          <a
            href={getEditDescriptionFormUrl(course)}
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
