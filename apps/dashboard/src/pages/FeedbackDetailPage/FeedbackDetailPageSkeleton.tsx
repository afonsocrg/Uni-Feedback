import {
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@uni-feedback/ui'
import { Edit3, MessageSquare } from 'lucide-react'

export function FeedbackDetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      {/* Info Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Navigation chips */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>

            {/* Fields */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <Tabs value="comment">
        <TabsList>
          <TabsTrigger value="comment">
            <Edit3 className="h-4 w-4" />
            <span>Comment</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <TabsContent value="comment" className="space-y-4">
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}