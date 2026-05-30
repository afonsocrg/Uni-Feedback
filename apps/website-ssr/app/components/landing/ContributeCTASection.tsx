import { Button } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getReviewPath } from '~/utils/i18n-routes'

export function ContributeCTASection() {
  const { t } = useTranslation('landing')
  const lang = useLang()

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-balance">
            {t('contribute_cta.title')}
          </h2>
          <p className="text-muted-foreground text-base">
            {t('contribute_cta.subtitle')}
          </p>
          <Button size="lg" className="text-base px-8" asChild>
            <a href={getReviewPath(lang)}>{t('contribute_cta.button')}</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
