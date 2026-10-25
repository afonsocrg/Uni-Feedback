import {
  CourseContentSection,
  type CourseContentField,
  type CourseTextLang
} from '.'

interface CourseAssessmentProps {
  course: {
    id: number
    name: string
    assessment?: string | null
    contentLang?: Partial<Record<CourseContentField, CourseTextLang>>
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
      contentLang={course.contentLang?.assessment}
    />
  )
}
