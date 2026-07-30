import { Outlet, useLocation } from 'react-router'
import { AuthGuard, ProfilePageSkeleton } from '~/components'
import { detectLang, isProfilePath } from '~/utils/i18n-routes'

export default function AuthLayout() {
  const location = useLocation()

  const getLoadingComponent = () => {
    const lang = detectLang(location.pathname)
    if (isProfilePath(location.pathname, lang)) {
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
