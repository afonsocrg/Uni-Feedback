import { Outlet, useLocation } from 'react-router'
import { AuthGuard, ProfilePageSkeleton } from '~/components'

export default function AuthLayout() {
  const location = useLocation()

  const getLoadingComponent = () => {
    if (
      location.pathname === '/perfil' ||
      location.pathname === '/en/profile'
    ) {
      return <ProfilePageSkeleton />
    }
    return undefined
  }

  return (
    <AuthGuard loadingComponent={getLoadingComponent()}>
      <Outlet />
    </AuthGuard>
  )
}
