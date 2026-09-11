import { Button } from '@uni-feedback/ui'
import { Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

/**
 * The chat is having a night off.
 *
 * Either the kill switch or the daily spend ceiling. This is our fault rather
 * than the student's, and it used to be indistinguishable from the coverage wall
 * because every refusal was a bare 403: an IST student during an outage was told
 * we had no data about their university. The API now sends a `code`, and this
 * screen is what it branches to.
 */
export function ChatRestingWall() {
  const { t } = useTranslation('chat')
  const lang = useLang()

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 py-10">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center">
        <Moon className="size-6 text-muted-foreground" />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold text-foreground">
            {t('resting_title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('resting_body')}</p>
        </div>
        <Button variant="outline" asChild>
          <a href={getLocalePath('browse', lang)}>{t('quota_browse')}</a>
        </Button>
      </div>
    </div>
  )
}

export function ChatQuotaWall() {
  const { t } = useTranslation('chat')
  const lang = useLang()

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted px-5 py-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">
          {t('quota_title')}
        </h3>
        <p className="text-sm text-muted-foreground">{t('quota_body')}</p>
      </div>
      <Button variant="outline" size="sm" className="self-start" asChild>
        <a href={getLocalePath('browse', lang)}>{t('quota_browse')}</a>
      </Button>
    </div>
  )
}
