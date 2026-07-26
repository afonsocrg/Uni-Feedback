import { CourseContentSection } from '.'

interface CourseDescriptionProps {
  course: {
    id: number
    name: string
    description?: string | null
  }
}

export function CourseDescription({ course }: CourseDescriptionProps) {
  return (
    <CourseContentSection
      course={course}
      field="description"
      content={course.description}
    />
  )
}
