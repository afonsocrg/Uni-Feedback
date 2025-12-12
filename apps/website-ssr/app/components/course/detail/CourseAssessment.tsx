import { Markdown } from '@uni-feedback/ui'

interface CourseAssessmentProps {
  course: {
    assessment?: string | null
  }
}

export function CourseAssessment({ course }: CourseAssessmentProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Assessment</h2>
      </div>
      {course.assessment ? (
        <Markdown>{course.assessment}</Markdown>
      ) : (
        <p className="text-gray-600 italic">
          We don't have assessment information for this course yet.
        </p>
      )}
    </div>
  )
}
