import { CourseContentSection } from '.'

interface CourseDescriptionProps {
  course: {
    id: number
    name: string
    description?: string | null
  }
  /** Open the correction dialog on arrival (a `?correct=` deep link). */
  autoOpen?: boolean
}

export function CourseDescription({
  course,
  autoOpen
}: CourseDescriptionProps) {
  return (
    <CourseContentSection
      course={course}
      field="description"
      autoOpen={autoOpen}
      content={course.description}
    />
  )
}
