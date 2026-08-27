import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger
} from '@uni-feedback/ui'
import { LogOut, Menu, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  LanguagePreferenceControl,
  ThemePreferenceControl
} from '~/components/layout/PreferenceControls'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'

interface MobileDrawerProps {
  browseLink: string
  isAuthenticated: boolean
  user?: {
    username: string
    email: string
  } | null
  logout: () => void
}

export function MobileDrawer({
  browseLink,
  isAuthenticated,
  user,
  logout
}: MobileDrawerProps) {
  const { t } = useTranslation()
  const lang = useLang()

  const trackNavClick = (destination: 'browse' | 'chat') => () =>
    analytics.navigation.navLinkClicked({
      destination,
      surface: 'mobile_menu',
      referrerPage: getPageName(window.location.pathname)
    })

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) return
        analytics.navigation.accountMenuOpened({
          surface: 'mobile_menu',
          isAuthenticated
        })
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" className="size-9 p-0">
          <Menu className="size-5" />
          <span className="sr-only">{t('nav.menu')}</span>
        </Button>
      </SheetTrigger>
      {/* Opens from the right because that is where its trigger now sits. A
          drawer flying in from the opposite edge to the button it came from
          reads as a different control answering. */}
      <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 pb-4">
            <h2 className="text-lg font-semibold">{t('nav.menu')}</h2>
          </div>
          <Separator />

          {/* Main Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base px-4"
                asChild
              >
                <a href={browseLink} onClick={trackNavClick('browse')}>
                  {t('nav.browse_courses')}
                </a>
              </Button>

              {/* The navbar chat entry is desktop-only, so without this the
                  chat is unreachable from the nav on a phone, which is where
                  most students are. */}
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base px-4"
                asChild
              >
                <a
                  href={`${getLocalePath('chat', lang)}?source=mobile_menu`}
                  onClick={trackNavClick('chat')}
                >
                  {t('nav.chat')}
                  <span
                    aria-hidden="true"
                    className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle"
                  />
                  <span className="sr-only"> (Beta)</span>
                </a>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base px-4"
                asChild
              >
                <a
                  href={`${getReviewPath(lang)}?from=nav_drawer`}
                  onClick={() => {
                    analytics.navigation.feedbackFormLinkClicked({
                      source: 'mobile_menu',
                      referrerPage: getPageName(window.location.pathname)
                    })
                  }}
                >
                  {t('nav.give_feedback')}
                </a>
              </Button>
            </div>
          </nav>

          {/* The same two preference controls as the account popover and the
              footer, so all three surfaces show one thing. */}
          <div className="px-5 pb-2">
            <ThemePreferenceControl
              surface="mobile_menu"
              isAuthenticated={isAuthenticated}
            />
            <LanguagePreferenceControl
              surface="mobile_menu"
              isAuthenticated={isAuthenticated}
            />
          </div>

          {/* Profile Section at Bottom */}
          <div className="p-4 pt-0 mt-auto">
            <Separator className="mb-4" />
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-11 text-base px-4"
                  asChild
                >
                  <a href={getLocalePath('profile', lang)}>
                    <User className="size-5 mr-3" />
                    {t('nav.profile')}
                  </a>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-11 text-base px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={logout}
                >
                  <LogOut className="size-5 mr-3" />
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground px-4">
                  {t('nav.sign_in_prompt')}
                </p>
                <Button className="w-full h-11" asChild>
                  <a href={getLocalePath('login', lang)}>{t('nav.sign_in')}</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
