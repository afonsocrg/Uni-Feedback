import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator
} from '@uni-feedback/ui'
import { LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Lang } from '~/i18n/config'
import { getLocalePath } from '~/utils/i18n-routes'

interface ProfilePopoverProps {
  isAuthenticated: boolean
  user?: {
    username: string
    email: string
  } | null
  logout: () => void
}

export function ProfilePopover({
  isAuthenticated,
  user,
  logout
}: ProfilePopoverProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="size-9 rounded-full p-0">
          <User className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Separator />
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
                asChild
              >
                <a href={getLocalePath('profile', lang)}>
                  <User className="size-4 mr-2" />
                  {t('nav.profile')}
                </a>
              </Button>
            </div>
            <Separator />
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              size="sm"
              onClick={logout}
            >
              <LogOut className="size-4 mr-2" />
              {t('nav.logout')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('nav.sign_in_to_platform')}
            </p>
            <Button className="w-full" size="sm" asChild>
              <a href={getLocalePath('login', lang)}>{t('nav.sign_in')}</a>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
