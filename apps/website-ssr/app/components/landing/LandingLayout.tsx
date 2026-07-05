import { isGiveawayActive } from '@uni-feedback/utils'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { AnnouncementBanner, LandingFooter, LandingHeader } from '~/components'
import { GiveawayCountdown } from '~/components/giveaway'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

interface LandingLayoutProps {
  children: React.ReactNode
}

export function LandingLayout({ children }: LandingLayoutProps) {
  const lang = useLang()
  const { t } = useTranslation('landing')
  const { pathname } = useLocation()

  // Only show the giveaway banner while the campaign is actually live (it hides
  // itself once the window closes). The giveaway pages already lead with the
  // giveaway, and the landing page has the promo band, so skip it there too.
  const isGiveawayPage = pathname.startsWith(getLocalePath('giveaway', lang))
  const isLandingPage = pathname === getLocalePath('home', lang)
  const showAnnouncementBanner =
    isGiveawayActive() && !isGiveawayPage && !isLandingPage

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showAnnouncementBanner && (
        <AnnouncementBanner
          bannerId="fnac-2026-giveaway"
          href={getLocalePath('giveaway', lang)}
        >
          <span className="inline-flex items-center gap-2">
            <span>{t('giveaway_promo.banner')}</span>
            <GiveawayCountdown variant="compact" className="px-2.5 py-0.5" />
            <span className="text-white/80">&rarr;</span>
          </span>
        </AnnouncementBanner>
      )}
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
      {/* <GiveawayDevPanel /> */}
    </div>
  )
}
