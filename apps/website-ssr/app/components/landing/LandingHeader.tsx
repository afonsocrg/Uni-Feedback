import { Button, cn } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { useMatches } from 'react-router'
import { useAuth, useLang } from '~/hooks'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'
import { AccountMenu } from './AccountMenu'
import { Logo } from './Logo'
import { MobileDrawer } from './MobileDrawer'

/**
 * Every item in this bar is one of three things, and each gets one fixed home:
 *
 *   places you go  → text links in the left group, with an active state
 *   the one action → the single filled button, far right
 *   you + settings → the account menu, never on the bar itself
 *
 * That is why theme and language are not here: they are set-once preferences,
 * and mixing them into the same row made six controls read as one pile.
 */
export function LandingHeader() {
  const { t } = useTranslation()
  const lang = useLang()
  const lastVisitedPath = useLastVisitedPath()
  const browsePath = getLocalePath('browse', lang)
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : browsePath
  const { user, isAuthenticated, logout } = useAuth()
  const activeKeys = useActiveRouteKeys()

  // Faculty and degree pages are root-level slugs, so there is no path prefix to
  // test. Route keys are stable (`buildRoutes` ids them `<lang>/<key>`), which
  // makes them the reliable way to ask "is the student browsing right now".
  const isBrowseActive = ['browse', 'faculty', 'degree', 'course'].some((key) =>
    activeKeys.has(key)
  )

  const reviewHref = `${getReviewPath(lang)}?from=navbar`
  const trackFeedbackClick = () => {
    analytics.navigation.feedbackFormLinkClicked({
      source: 'navbar',
      referrerPage: getPageName(window.location.pathname)
    })
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Logo variant="desktop" />

          {/* Stretched to the full bar height so the active underline can be
              positioned against the header's own border rather than against
              whatever the tallest sibling in the row happens to be. */}
          <nav className="ml-6 flex items-stretch self-stretch gap-1">
            <NavLink
              href={browseLink}
              isActive={isBrowseActive}
              onClick={() =>
                analytics.navigation.navLinkClicked({
                  destination: 'browse',
                  surface: 'navbar',
                  referrerPage: getPageName(window.location.pathname)
                })
              }
            >
              {t('nav.browse_courses')}
            </NavLink>

            {/* Chat is reachable from everywhere on purpose: the goal is that
                students slide into it rather than having to find it. */}
            <NavLink
              href={`${getLocalePath('chat', lang)}?source=navbar`}
              isActive={activeKeys.has('chat')}
              onClick={() =>
                analytics.navigation.navLinkClicked({
                  destination: 'chat',
                  surface: 'navbar',
                  referrerPage: getPageName(window.location.pathname)
                })
              }
            >
              {t('nav.chat')}
              {/* A dot instead of a "Beta" pill: the pill was a whole extra
                  object in the scan. The word itself lives on the chat page. */}
              <span
                aria-hidden="true"
                className="ml-1 inline-block size-1.5 rounded-full bg-primary align-middle"
              />
              <span className="sr-only"> (Beta)</span>
            </NavLink>
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <Button size="sm" asChild>
              <a href={reviewHref} onClick={trackFeedbackClick}>
                {t('nav.give_feedback_cta')}
              </a>
            </Button>

            <AccountMenu
              isAuthenticated={isAuthenticated}
              user={user}
              logout={logout}
            />
          </div>
        </div>

        {/* Mobile: logo left, action and menu right, where the thumb is. The
            old bar centred the logo against an empty spacer and buried the
            primary action two taps deep inside the drawer. */}
        <div className="flex md:hidden items-center gap-2">
          <Logo variant="mobile" />
          <div className="flex-1" />
          <Button size="sm" asChild>
            <a href={reviewHref} onClick={trackFeedbackClick}>
              {t('nav.give_feedback_cta')}
            </a>
          </Button>
          <MobileDrawer
            browseLink={browseLink}
            isAuthenticated={isAuthenticated}
            user={user}
            logout={logout}
          />
        </div>
      </div>
    </header>
  )
}

interface NavLinkProps {
  href: string
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}

function NavLink({ href, isActive, onClick, children }: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center rounded-md px-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
      {isActive && (
        // Lands on the header's bottom rule: 16px of container padding below
        // the stretched link, then the 1px border itself.
        <span className="absolute inset-x-3 -bottom-[17px] h-0.5 rounded-t-full bg-primary" />
      )}
    </a>
  )
}

/**
 * The route keys matched by the current URL. `buildRoutes` gives every route an
 * id of `<lang>/<key>`, so the key survives both locales and dynamic segments.
 */
function useActiveRouteKeys(): Set<string> {
  const matches = useMatches()
  return new Set(matches.map((match) => match.id.split('/')[1]))
}
