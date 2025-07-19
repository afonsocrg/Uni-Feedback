import { SchoolYearSectionSkeleton } from '@components'

export function CourseReviewsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(1)].map((_, i) => (
        <SchoolYearSectionSkeleton key={i} />
      ))}
    </div>
  )
}
