import { CourseContentSection } from '.'

interface CourseAssessmentProps {
  course: {
    id: number
    name: string
    assessment?: string | null
  }
  /** Open the correction dialog on arrival (a `?correct=` deep link). */
  autoOpen?: boolean
}

export function CourseAssessment({ course, autoOpen }: CourseAssessmentProps) {
  return (
    <CourseContentSection
      course={course}
      field="assessment"
      autoOpen={autoOpen}
      content={course.assessment}
    />
  )
}
