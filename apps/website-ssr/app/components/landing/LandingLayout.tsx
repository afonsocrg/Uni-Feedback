import { Gift } from 'lucide-react'
import { useLocation } from 'react-router'
import { AnnouncementBanner, LandingFooter, LandingHeader } from '~/components'

interface LandingLayoutProps {
  children: React.ReactNode
}

export function LandingLayout({ children }: LandingLayoutProps) {
  const { pathname } = useLocation()
  const isGiveawayPage = pathname.startsWith('/giveaway')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isGiveawayPage && (
        <AnnouncementBanner bannerId="nos-alive-2026-giveaway">
          <a
            href="/giveaway"
            className="inline-flex items-center gap-2 hover:text-white transition-colors"
          >
            <Gift className="size-4" />
            <span>Win a ticket to NOS Alive 2026! Join the Uni Feedback giveaway</span>
            <span className="text-white/80">&rarr;</span>
          </a>
        </AnnouncementBanner>
      )}
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  )
}
