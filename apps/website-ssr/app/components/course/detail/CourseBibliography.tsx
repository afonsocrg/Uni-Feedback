import { CourseContentSection } from '.'

interface CourseBibliographyProps {
  course: {
    id: number
    name: string
    bibliography?: string | null
  }
}

export function CourseBibliography({ course }: CourseBibliographyProps) {
  return (
    <CourseContentSection
      course={course}
      field="bibliography"
      content={course.bibliography}
    />
  )
}
