import { useLocation } from 'react-router'
import { LandingFooter, LandingHeader } from '~/components'

interface LandingLayoutProps {
  children: React.ReactNode
}

export function LandingLayout({ children }: LandingLayoutProps) {
  const { pathname } = useLocation()
  // const showAnnouncementBanner = !isGiveawayPage && !isLandingPage

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* {showAnnouncementBanner && (
        <AnnouncementBanner bannerId="nos-alive-2026-giveaway" href="/giveaway">
          <span className="inline-flex items-center gap-2">
            <Gift className="size-4" />
            <span>NOS Alive 2026 giveaway has ended! See the results</span>
            <span className="text-white/80">&rarr;</span>
          </span>
        </AnnouncementBanner>
      )} */}
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  )
}
