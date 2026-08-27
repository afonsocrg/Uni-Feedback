import { Button, Separator } from '@uni-feedback/ui'
import { LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  LanguagePreferenceControl,
  ThemePreferenceControl
} from '~/components/layout/PreferenceControls'
import { useLang } from '~/hooks'
import type { NavSurface } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'

interface AccountMenuContentProps {
  isAuthenticated: boolean
  user?: { username: string; email: string } | null
  logout: () => void
  surface: NavSurface
}

/**
 * What opens when you click "you".
 *
 * Extracted from the header's account menu so the chat sidebar can show the
 * same thing. The chat is a separate surface with its own chrome, and rebuilding
 * a second, slightly different account menu there is how two menus drift apart.
 * Only the trigger differs: a pill in the header, a full-width row at the foot
 * of the chat sidebar.
 *
 * Opens in both auth states on purpose: theme and language live in here, so a
 * bare sign-in button would leave signed-out visitors unable to reach either.
 */
export function AccountMenuContent({
  isAuthenticated,
  user,
  logout,
  surface
}: AccountMenuContentProps) {
  const { t } = useTranslation()
  const lang = useLang()

  if (!isAuthenticated) {
    return (
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

        <ThemePreferenceControl surface={surface} isAuthenticated={false} />
        <LanguagePreferenceControl surface={surface} isAuthenticated={false} />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="px-2 py-1.5">
        <p className="truncate text-sm font-semibold">{user?.username}</p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
      </div>

      <Separator />

      <Button variant="ghost" className="w-full justify-start" asChild>
        <a href={getLocalePath('profile', lang)}>
          <User className="size-4" />
          {t('nav.profile')}
        </a>
      </Button>

      <Separator />

      <ThemePreferenceControl surface={surface} isAuthenticated />
      <LanguagePreferenceControl surface={surface} isAuthenticated />

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
  )
}

/** Initials for the avatar, shared so both triggers render the same badge. */
export function getInitials(username?: string): string {
  if (!username) return '?'
  const parts = username
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
