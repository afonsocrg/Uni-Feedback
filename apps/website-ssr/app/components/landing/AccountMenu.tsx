import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator
} from '@uni-feedback/ui'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  LanguagePreferenceControl,
  ThemePreferenceControl
} from '~/components/layout/PreferenceControls'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'

interface AccountMenuProps {
  isAuthenticated: boolean
  user?: {
    username: string
    email: string
  } | null
  logout: () => void
}

/**
 * The single home for "you and your settings" on desktop. It is the only place
 * theme and language live in the header, so it must open in BOTH auth states:
 * a bare sign-in button would leave signed-out visitors with no way to change
 * either. The footer carries the same two controls as the discoverable fallback.
 */
export function AccountMenu({
  isAuthenticated,
  user,
  logout
}: AccountMenuProps) {
  const { t } = useTranslation()
  const lang = useLang()

  const initials = getInitials(user?.username)

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) return
        analytics.navigation.accountMenuOpened({
          surface: 'navbar',
          isAuthenticated
        })
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={isAuthenticated ? t('nav.account') : t('nav.sign_in')}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border py-0.5 pr-2 pl-0.5 text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isAuthenticated ? (
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
          ) : (
            <>
              <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                <User className="size-4" />
              </span>
              {/* The language code only appears when signed out. Signed in, the
                  menu already has a reason to be opened (profile, logout), so
                  the label stops earning its space, and "AG PT" reads badly. */}
              <span className="text-xs font-semibold text-foreground">
                {lang.toUpperCase()}
              </span>
            </>
          )}
          <ChevronDown className="size-3.5" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-1.5" align="end">
        {isAuthenticated ? (
          <div className="space-y-1">
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-semibold">{user?.username}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>

            <Separator />

            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href={getLocalePath('profile', lang)}>
                <User className="size-4" />
                {t('nav.profile')}
              </a>
            </Button>

            <Separator />

            <ThemePreferenceControl surface="navbar" isAuthenticated />
            <LanguagePreferenceControl surface="navbar" isAuthenticated />

            <Separator />

            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="size-4" />
              {t('nav.logout')}
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="space-y-2 px-2 py-1.5">
              <p className="text-sm text-muted-foreground">
                {t('nav.sign_in_prompt')}
              </p>
              <Button className="w-full" asChild>
                <a href={getLocalePath('login', lang)}>{t('nav.sign_in')}</a>
              </Button>
            </div>

            <Separator />

            <ThemePreferenceControl surface="navbar" isAuthenticated={false} />
            <LanguagePreferenceControl
              surface="navbar"
              isAuthenticated={false}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function getInitials(username?: string): string {
  if (!username) return '?'
  const parts = username
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
