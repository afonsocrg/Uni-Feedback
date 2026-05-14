import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '~/hooks'
import { detectLang } from '~/utils/i18n-routes'

interface AuthGuardProps {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
}

export function AuthGuard({ children, loadingComponent }: AuthGuardProps) {
  const { isAuthenticated, user, isLoading, isLoggingOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('feedback')

  useEffect(() => {
    if (isLoggingOut) return

    if (!isLoading && (!isAuthenticated || !user)) {
      toast.error(t('auth.unauthorized_toast'))

      const lang = detectLang(location.pathname)
      const loginPath = lang === 'en' ? '/en/login' : '/login'
      const redirectUrl = `${location.pathname}${location.search}`
      navigate(`${loginPath}?redirect=${encodeURIComponent(redirectUrl)}`, {
        replace: true
      })
    }
  }, [isLoading, isAuthenticated, user, isLoggingOut, navigate, location, t])

  if (isLoading || isLoggingOut || !isAuthenticated || !user) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{t('auth.loading')}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
