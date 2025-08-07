import { useQuery } from '@tanstack/react-query'
import { getAdminFeedbackDetails } from '@uni-feedback/api-client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@uni-feedback/ui'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { InvalidIdError } from '../../components/InvalidIdError'
import { QueryError } from '../../components/QueryError'
import { CommentTabContent } from './CommentTabContent'
import { FeedbackDetailPageSkeleton } from './FeedbackDetailPageSkeleton'
import { FeedbackInfoCard } from './FeedbackInfoCard'

function getTabTitle(activeTab: string): string {
  switch (activeTab) {
    case 'comment':
      return 'Comment'
    default:
      return 'Details'
  }
}

export function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>()

  // Tab state
  const [activeTab, setActiveTab] = useState('comment')

  const feedbackId = id ? parseInt(id, 10) : 0

  const {
    data: feedback,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['feedback-details', feedbackId],
    queryFn: () => getAdminFeedbackDetails(feedbackId),
    enabled: !!feedbackId
  })

  if (!feedbackId) {
    return <InvalidIdError entityType="feedback" />
  }

  if (error) {
    return (
      <QueryError
        entityType="feedback"
        error={error}
        onRetry={() => refetch()}
      />
    )
  }

  if (isLoading || !feedback) {
    return <FeedbackDetailPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primaryBlue">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Feedback Details</h1>
        </div>
      </div>

      <FeedbackInfoCard feedback={feedback} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="comment">
            <MessageSquare className="h-4 w-4" />
            <span>Comment</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content Card */}
        <Card>
          <CardHeader>
            <CardTitle>{getTabTitle(activeTab)}</CardTitle>
          </CardHeader>
          <CardContent>
            <TabsContent value="comment" className="space-y-4">
              <CommentTabContent feedback={feedback} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
