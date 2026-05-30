import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger
} from '@uni-feedback/ui'
import { LogOut, Menu, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '~/components/layout/LanguageSwitcher'
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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" className="size-9 p-0">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('nav.menu')}</h2>
            <LanguageSwitcher />
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
                <a href={browseLink}>{t('nav.browse_courses')}</a>
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
