import { CourseContentSection } from '.'

interface CourseBibliographyProps {
  course: {
    id: number
    name: string
    bibliography?: string | null
  }
  /** Open the correction dialog on arrival (a `?correct=` deep link). */
  autoOpen?: boolean
}

export function CourseBibliography({
  course,
  autoOpen
}: CourseBibliographyProps) {
  return (
    <CourseContentSection
      course={course}
      field="bibliography"
      autoOpen={autoOpen}
      content={course.bibliography}
    />
  )
}
