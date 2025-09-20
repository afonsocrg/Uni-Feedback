export function FeedbackSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {/* Star rating skeleton */}
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
          {/* Date skeleton */}
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse ml-4" />
        </div>
      </div>
      {/* Comment skeleton */}
      <div className="space-y-3">
        <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
        <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
