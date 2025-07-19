import { FeedbackSkeleton } from '@components'

export function SchoolYearSectionSkeleton() {
  return (
    <div>
      {/* School year title skeleton */}
      <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4" />
      {/* Feedback skeletons */}
      {[...Array(2)].map((_, i) => (
        <FeedbackSkeleton key={i} />
      ))}
    </div>
  )
}
