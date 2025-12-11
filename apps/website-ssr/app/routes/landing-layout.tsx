import { Outlet } from 'react-router'
import { LandingFooter, LandingHeader } from '../components/landing'

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}
