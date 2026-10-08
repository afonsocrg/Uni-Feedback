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
import { MessageSquare, User } from 'lucide-react'

export function UserDetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-12" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-56" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value="feedback">
        <TabsList>
          <TabsTrigger value="feedback">
            <MessageSquare className="h-4 w-4" />
            <span>Feedback</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <TabsContent value="feedback" className="space-y-4">
              <Skeleton className="h-32 w-full" />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
