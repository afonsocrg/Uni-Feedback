import { Button } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

/**
 * The coverage wall.
 *
 * A student whose university is not switched on is the most frustrating moment
 * in the product, so it is not a dead end: it is a demand signal, a request for
 * help, and a number we can later put in front of that university's student
 * association.
 *
 * The asks are branched because they have to match the person. An enrolled
 * student can review a course; an applicant can only ask to be told when we
 * open.
 */
export function ChatCoverageWall() {
  const { t } = useTranslation('chat')
  const lang = useLang()

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="flex max-w-lg flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          {t('coverage_title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('coverage_body')}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={getLocalePath('feedback-new', lang)}>
              {t('coverage_review')}
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={getLocalePath('browse', lang)}>{t('quota_browse')}</a>
          </Button>
        </div>
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
