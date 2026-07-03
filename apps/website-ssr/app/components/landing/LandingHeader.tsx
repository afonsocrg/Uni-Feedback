import { Button } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '~/components/layout/LanguageSwitcher'
import { ThemeToggle } from '~/components/layout/ThemeToggle'
import { useAuth, useLang } from '~/hooks'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'
import { Logo } from './Logo'
import { MobileDrawer } from './MobileDrawer'
import { ProfilePopover } from './ProfilePopover'

export function LandingHeader() {
  const { t } = useTranslation()
  const lang = useLang()
  const lastVisitedPath = useLastVisitedPath()
  const browsePath = getLocalePath('browse', lang)
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : browsePath
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <Logo variant="desktop" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button size="sm" variant="ghost" asChild>
              <a
                href={`${getReviewPath(lang)}?from=navbar`}
                onClick={() => {
                  analytics.navigation.feedbackFormLinkClicked({
                    source: 'navbar',
                    referrerPage: getPageName(window.location.pathname)
                  })
                }}
              >
                {t('nav.give_feedback_cta')}
              </a>
            </Button>
            <Button
              size="sm"
              className="shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary/90"
              asChild
            >
              <a href={browseLink}>{t('nav.browse_courses')}</a>
            </Button>

            <ProfilePopover
              isAuthenticated={isAuthenticated}
              user={user}
              logout={logout}
            />
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between">
          <MobileDrawer
            browseLink={browseLink}
            isAuthenticated={isAuthenticated}
            user={user}
            logout={logout}
          />
          <Logo variant="mobile" />
          {/* Spacer to keep the logo centered (toggles now live in the drawer) */}
          <div className="size-9" />
        </div>
      </div>
    </header>
  )
}
