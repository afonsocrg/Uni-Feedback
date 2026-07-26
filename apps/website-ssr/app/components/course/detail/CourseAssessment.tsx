import { CourseContentSection } from '.'

interface CourseAssessmentProps {
  course: {
    id: number
    name: string
    assessment?: string | null
  }
}

export function CourseAssessment({ course }: CourseAssessmentProps) {
  return (
    <CourseContentSection
      course={course}
      field="assessment"
      content={course.assessment}
    />
  )
}
