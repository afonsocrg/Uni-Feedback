import { Outlet, useLocation } from 'react-router'
import { AuthGuard, ProfilePageSkeleton } from '~/components'

export default function AuthLayout() {
  const location = useLocation()

  // Determine loading component based on route
  const getLoadingComponent = () => {
    if (location.pathname === '/profile') {
      return <ProfilePageSkeleton />
    }
    // Add more route-specific skeletons here as needed
    return undefined // Falls back to default spinner
  }

  return (
    <AuthGuard loadingComponent={getLoadingComponent()}>
      <Outlet />
    </AuthGuard>
  )
}
