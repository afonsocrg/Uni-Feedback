import { Tabs, TabsContent, TabsList, TabsTrigger } from '@uni-feedback/ui'
import { Gift, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DeleteAccountSection,
  GenericBreadcrumb,
  ProfileFeedbackTab,
  ProfilePageSkeleton,
  ProfileUserInfo,
  ReferralCard
} from '~/components'
import { GiveawayTab } from '~/components/giveaway/GiveawayTab'
import { useRequiredAuth } from '~/hooks'
import { useProfileFeedback, useProfileStats } from '~/hooks/queries'
import { STORAGE_KEYS } from '~/utils/constants'
import { buildMeta, metaT } from '~/utils/meta'
import type { Route } from './+types/profile'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'feedback')
  return buildMeta({
    matches,
    title: t('profile.meta_title'),
    description: t('profile.meta_desc')
  })
}

export default function ProfilePage() {
  const { t } = useTranslation('feedback')
  const { user, logout } = useRequiredAuth()
  const [activeTab, setActiveTab] = useState('feedback')

  // Restore the last-opened tab. Read in an effect (not during render) so it
  // stays hydration-safe; the page shows a skeleton while data loads, so the
  // tab is set before real content paints.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE_ACTIVE_TAB)
    if (saved === 'feedback' || saved === 'giveaway') {
      setActiveTab(saved)
    }
  }, [])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem(STORAGE_KEYS.PROFILE_ACTIVE_TAB, value)
  }

  const { data: statsData, isLoading: isStatsLoading } = useProfileStats()
  const { data: feedbackData, isLoading: isFeedbackLoading } =
    useProfileFeedback()

  const stats = statsData?.stats

  // Show skeleton on initial load
  const isInitialLoading = isStatsLoading || isFeedbackLoading

  if (isInitialLoading) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="min-h-full bg-muted/30">
      <div className="container mx-auto px-4 pt-6">
        <GenericBreadcrumb
          items={[{ label: t('profile.page_title'), isActive: true }]}
        />
      </div>
      <div className="mx-auto px-4 py-8 max-w-4xl">
        {/* Top Section: User Info + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <ProfileUserInfo
            email={user.email}
            stats={stats}
            isStatsLoading={isStatsLoading}
          />

          {/* Right: Referral Section */}
          <div className="space-y-5">
            <ReferralCard referralCode={user.referralCode} />
          </div>
        </div>

        {/* Feedback + Giveaway Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="mb-12"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="feedback">
              <MessageSquare className="size-4" />
              <span>{t('profile.tab_feedback')}</span>
            </TabsTrigger>
            <TabsTrigger value="giveaway">
              <Gift className="size-4" />
              <span>{t('profile.tab_giveaway')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feedback">
            <ProfileFeedbackTab
              feedbackData={feedbackData}
              isFeedbackLoading={isFeedbackLoading}
            />
          </TabsContent>

          <TabsContent value="giveaway">
            <GiveawayTab referralCode={user.referralCode} />
          </TabsContent>
        </Tabs>

        <DeleteAccountSection email={user.email} logout={logout} />
      </div>
    </div>
  )
}
