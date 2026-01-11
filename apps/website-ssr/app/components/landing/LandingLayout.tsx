import { LandingFooter, LandingHeader } from '~/components'

interface LandingLayoutProps {
  children: React.ReactNode
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  )
}
