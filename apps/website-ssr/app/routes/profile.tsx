import { Tabs, TabsContent, TabsList, TabsTrigger } from '@uni-feedback/ui'
import { Gift, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DeleteAccountSection,
  GenericBreadcrumb,
  ProfileFeedbackTab,
  ProfilePageSkeleton,
  ProfileUserInfo
} from '~/components'
import { GiveawayTab } from '~/components/giveaway/GiveawayTab'
import { ReferralShareButtons } from '~/components/referral/ReferralShareButtons'
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
  const [activeTab, setActiveTab] = useState('giveaway')

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
        {/* Top: the same compact identity on every tab. The point breakdown
            lives in the points popover and the invite CTA lives inside each
            tab's content, so switching tabs never shifts this row. */}
        <div className="mb-8">
          <ProfileUserInfo
            email={user.email}
            stats={stats}
            isStatsLoading={isStatsLoading}
          />
        </div>

        {/* Feedback + Giveaway Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="mb-12"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="giveaway">
              <Gift className="size-4" />
              <span>{t('profile.tab_giveaway')}</span>
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="size-4" />
              <span>{t('profile.tab_feedback')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="giveaway">
            <GiveawayTab referralCode={user.referralCode} />
          </TabsContent>

          <TabsContent value="feedback">
            <ProfileFeedbackTab
              feedbackData={feedbackData}
              isFeedbackLoading={isFeedbackLoading}
            />
            {/* Light invite nudge (the giveaway tab has its own in the
                referrals tile, so this only shows here). */}
            {user.referralCode && (
              <div className="mt-8 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {t('profile.referral_title')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.referral_desc')}
                  </p>
                </div>
                <div className="sm:w-72 sm:flex-none">
                  <ReferralShareButtons
                    referralCode={user.referralCode}
                    surface="profile"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DeleteAccountSection email={user.email} logout={logout} />
      </div>
    </div>
  )
}
