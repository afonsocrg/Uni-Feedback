import { Markdown } from '@uni-feedback/ui'

interface CourseBibliographyProps {
  course: {
    bibliography?: string | null
  }
}

export function CourseBibliography({ course }: CourseBibliographyProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Bibliography</h2>
      </div>
      {course.bibliography ? (
        <Markdown>{course.bibliography}</Markdown>
      ) : (
        <p className="text-gray-600 italic">
          We don't have a bibliography for this course yet.
        </p>
      )}
    </div>
  )
}