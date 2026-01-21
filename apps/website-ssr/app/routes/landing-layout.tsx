import { Outlet } from 'react-router'
import { LandingLayout } from '~/components'

export default function LandingLayoutRoute() {
  return (
    <LandingLayout>
      <Outlet />
    </LandingLayout>
  )
}
