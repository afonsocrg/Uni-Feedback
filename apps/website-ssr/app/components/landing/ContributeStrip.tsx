import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getReviewPath } from '~/utils/i18n-routes'

export function ContributeStrip() {
  const { t } = useTranslation('landing')
  const lang = useLang()

  return (
    <div className="relative flex items-center justify-center py-6">
      <div className="absolute inset-x-0 top-1/2 bottom-0 bg-muted/30" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <a
        href={getReviewPath(lang)}
        className="relative bg-background border rounded-full px-5 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shadow-sm"
      >
        {t('contribute_strip.text')}
      </a>
    </div>
  )
}
