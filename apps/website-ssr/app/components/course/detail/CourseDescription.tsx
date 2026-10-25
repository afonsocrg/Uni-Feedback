import {
  CourseContentSection,
  type CourseContentField,
  type CourseTextLang
} from '.'

interface CourseDescriptionProps {
  course: {
    id: number
    name: string
    description?: string | null
    contentLang?: Partial<Record<CourseContentField, CourseTextLang>>
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
      contentLang={course.contentLang?.description}
    />
  )
}
