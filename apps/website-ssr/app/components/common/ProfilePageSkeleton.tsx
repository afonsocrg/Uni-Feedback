import { Skeleton } from '@uni-feedback/ui'

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-full bg-gray-50/30">
      <div className="container mx-auto px-4 pt-6">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="mx-auto px-4 py-8 max-w-4xl">
        {/* Top Section: User Info + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left: User Info & Stats */}
          <div className="space-y-6">
            {/* User Avatar & Email with Total Points */}
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>

            {/* Point Breakdown */}
            <div className="space-y-2">
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>

          {/* Right: Referral Section */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Your Feedback Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="space-y-4">
            {/* Feedback card skeletons */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border rounded-lg p-4 bg-white space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-8 border-t">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-10 w-32 sm:flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}
