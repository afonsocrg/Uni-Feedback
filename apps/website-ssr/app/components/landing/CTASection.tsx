import { Button } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import type { Lang } from '~/i18n/config'
import { getReviewPath } from '~/utils/i18n-routes'

interface CTASectionProps {
  contributors: number
}

export function CTASection({ contributors }: CTASectionProps) {
  const { t, i18n } = useTranslation('landing')
  const lang = i18n.language as Lang

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-[560px] mx-auto text-center space-y-6">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-balance">
            {t('cta.join_text', { count: contributors })}
          </h2>
          <div className="flex flex-col items-center gap-2 mt-2">
            <Button size="lg" className="text-base px-8" asChild>
              <a href={getReviewPath(lang)}>{t('cta.button')}</a>
            </Button>
            <p className="text-xs text-muted-foreground/60">{t('cta.note')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
