import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '~/hooks'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Only redirect after auth has been checked (not loading)
    if (!isLoading && (!isAuthenticated || !user)) {
      // Show toast notification
      toast.error('Please log in to access this page')

      // Redirect to login with current location as redirect parameter
      // Use replace: true to avoid adding to history (prevents back button issues)
      const redirectUrl = `${location.pathname}${location.search}`
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`, {
        replace: true
      })
    }
  }, [isLoading, isAuthenticated, user, navigate, location])

  // Show loading animation while checking auth or redirecting
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
