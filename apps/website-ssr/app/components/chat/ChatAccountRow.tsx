import { Popover, PopoverContent, PopoverTrigger } from '@uni-feedback/ui'
import { ChevronsUpDown, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AccountMenuContent,
  getInitials
} from '~/components/account/AccountMenuContent'
import { useAuth, useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'

/**
 * "You", at the foot of the chat sidebar.
 *
 * The chat has no site header, so this is the only place account, theme and
 * language can live. It opens the same menu as the header's account pill: only
 * the trigger differs, a full-width row here rather than a pill, because it is
 * anchored to the bottom of a column and reads as a row.
 */
export function ChatAccountRow() {
  const { t } = useTranslation()
  const lang = useLang()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) return
        analytics.navigation.accountMenuOpened({
          surface: 'chat_sidebar',
          isAuthenticated
        })
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={isAuthenticated ? t('nav.account') : t('nav.sign_in')}
          className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isAuthenticated ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {getInitials(user?.username)}
            </span>
          ) : (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="size-4 text-muted-foreground" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {isAuthenticated ? user?.username : t('nav.sign_in')}
            </span>
            {isAuthenticated && (
              <span className="block truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            )}
          </span>
          {!isAuthenticated && (
            <span className="text-xs font-semibold text-muted-foreground">
              {lang.toUpperCase()}
            </span>
          )}
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      {/* Upwards and aligned to the column: it sits at the bottom of a sidebar. */}
      <PopoverContent className="w-64 p-1.5" align="start" side="top">
        <AccountMenuContent
          isAuthenticated={isAuthenticated}
          user={user}
          logout={logout}
          surface="chat_sidebar"
        />
      </PopoverContent>
    </Popover>
  )
}
