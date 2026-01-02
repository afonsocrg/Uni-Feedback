import { Outlet } from 'react-router'
import { LandingLayout } from '../components/landing'

export default function LandingLayoutRoute() {
  return (
    <LandingLayout>
      <Outlet />
    </LandingLayout>
  )
}
