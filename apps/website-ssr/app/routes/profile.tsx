import { Tabs, TabsContent, TabsList, TabsTrigger } from '@uni-feedback/ui'
import { Gift, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import {
  DeleteAccountSection,
  GenericBreadcrumb,
  ProfileFeedbackTab,
  ProfilePageSkeleton,
  ProfileUserInfo
} from '~/components'
import { GiveawayTab } from '~/components/giveaway/GiveawayTab'
import { ReferralShareButtons } from '~/components/referral/ReferralShareButtons'
import { useLang, useRequiredAuth } from '~/hooks'
import { useProfileFeedback, useProfileStats } from '~/hooks/queries'
import { STORAGE_KEYS } from '~/utils/constants'
import {
  DEFAULT_PROFILE_TAB,
  getProfilePath,
  isProfileTab
} from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import type { Route } from './+types/profile'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'feedback')
  return buildMeta({
    matches,
    title: t('profile.meta_title'),
    description: t('profile.meta_desc'),
    // Private, auth-only page. Now that each tab has its own URL, make sure
    // none of them get indexed.
    robots: 'noindex, nofollow'
  })
}

export default function ProfilePage() {
  const { t } = useTranslation('feedback')
  const lang = useLang()
  const navigate = useNavigate()
  const { user, logout } = useRequiredAuth()

  // The URL is the source of truth for the open tab, so every tab is a
  // shareable permalink. Bare /perfil (and any unknown tab) falls back to the
  // last-opened tab and canonicalises itself to /perfil/<tab> below.
  const { tab } = useParams()
  const urlTab = isProfileTab(tab) ? tab : null
  const [fallbackTab, setFallbackTab] = useState(DEFAULT_PROFILE_TAB)
  const activeTab = urlTab ?? fallbackTab

  // Read localStorage in an effect (not during render) so it stays
  // hydration-safe; the page shows a skeleton while data loads, so the tab is
  // resolved before real content paints.
  useEffect(() => {
    if (urlTab) {
      localStorage.setItem(STORAGE_KEYS.PROFILE_ACTIVE_TAB, urlTab)
      return
    }
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE_ACTIVE_TAB)
    const next = isProfileTab(saved) ? saved : DEFAULT_PROFILE_TAB
    setFallbackTab(next)
    navigate(getProfilePath(lang, next), { replace: true })
  }, [urlTab, lang, navigate])

  // `replace` keeps tab switching out of the history stack, so Back still
  // leaves the profile instead of cycling through tabs.
  const handleTabChange = (value: string) => {
    if (!isProfileTab(value)) return
    localStorage.setItem(STORAGE_KEYS.PROFILE_ACTIVE_TAB, value)
    navigate(getProfilePath(lang, value), { replace: true })
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
