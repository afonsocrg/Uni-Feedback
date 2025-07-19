import { CourseCard } from '@components'
import { type Course } from '@services/meicFeedbackAPI'

interface CourseGridProps {
  courses: Course[]
}

export function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} {...{ courseId: course.id, ...course }} />
      ))}
    </div>
  )
}
