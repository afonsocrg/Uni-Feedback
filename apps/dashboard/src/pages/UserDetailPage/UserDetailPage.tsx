import { useQuery } from '@tanstack/react-query'
import {
  getAdminUserDetails,
  type AdminUserDetail
} from '@uni-feedback/api-client'
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
import { Bot, GraduationCap, MessageSquare, User, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { InvalidIdError } from '../../components/InvalidIdError'
import { QueryError } from '../../components/QueryError'
import { UserChatsTabContent } from './UserChatsTabContent'
import { UserDetailPageSkeleton } from './UserDetailPageSkeleton'
import { UserFeedbackTabContent } from './UserFeedbackTabContent'
import { UserInfoCard } from './UserInfoCard'
import { UserJourneyTabContent } from './UserJourneyTabContent'
import { UserReferralsTabContent } from './UserReferralsTabContent'

function getTabTitle(activeTab: string, user: AdminUserDetail): string {
  switch (activeTab) {
    case 'chats':
      return `AI Chats ${user.chatCount ? `(${user.chatCount})` : ''}`
    case 'referrals':
      return `Referrals ${user.referralCount ? `(${user.referralCount})` : ''}`
    case 'journey':
      return `Academic journey ${user.journeyDegreeCount ? `(${user.journeyDegreeCount})` : ''}`
    default:
      return `Feedback ${user.feedbackCount ? `(${user.feedbackCount})` : ''}`
  }
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('feedback')

  const userId = id ? parseInt(id, 10) : 0

  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-details', userId],
    queryFn: () => getAdminUserDetails(userId),
    enabled: !!userId
  })

  if (!userId) {
    return <InvalidIdError entityType="user" />
  }

  if (error) {
    return (
      <QueryError entityType="user" error={error} onRetry={() => refetch()} />
    )
  }

  if (isLoading || !user) {
    return <UserDetailPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primaryBlue">
          <User className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{user.username}</h1>
        </div>
      </div>

      <UserInfoCard user={user} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="feedback">
            <MessageSquare className="h-4 w-4" />
            <span>Feedback ({user.feedbackCount})</span>
          </TabsTrigger>
          <TabsTrigger value="chats">
            <Bot className="h-4 w-4" />
            <span>AI Chats ({user.chatCount})</span>
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <UserPlus className="h-4 w-4" />
            <span>Referrals ({user.referralCount})</span>
          </TabsTrigger>
          <TabsTrigger value="journey">
            <GraduationCap className="h-4 w-4" />
            <span>Academic journey ({user.journeyDegreeCount})</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>{getTabTitle(activeTab, user)}</CardTitle>
          </CardHeader>
          <CardContent>
            <TabsContent value="feedback" className="space-y-4">
              <UserFeedbackTabContent userId={userId} />
            </TabsContent>
            <TabsContent value="chats" className="space-y-4">
              <UserChatsTabContent userId={userId} />
            </TabsContent>
            <TabsContent value="referrals" className="space-y-4">
              <UserReferralsTabContent userId={userId} />
            </TabsContent>
            <TabsContent value="journey" className="space-y-4">
              <UserJourneyTabContent userId={userId} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
