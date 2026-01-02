import { Outlet } from 'react-router'
import { AuthGuard } from '~/components'

export default function AuthLayout() {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  )
}
