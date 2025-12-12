import { Markdown } from '@uni-feedback/ui'

interface CourseDescriptionProps {
  course: {
    description?: string | null
  }
}

export function CourseDescription({ course }: CourseDescriptionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Description</h2>
      </div>
      {course.description ? (
        <Markdown>{course.description}</Markdown>
      ) : (
        <p className="text-gray-600 italic">
          We don't have a description for this course yet.
        </p>
      )}
    </div>
  )
}
