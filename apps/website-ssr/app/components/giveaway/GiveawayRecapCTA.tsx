import { Button } from '@uni-feedback/ui'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

export function GiveawayRecapCTA() {
  const lang = useLang()
  const { t } = useTranslation('legal')

  return (
    <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-6">
            {t('giveaway_recap.cta_title')}
          </h2>

          <p className="text-muted-foreground mb-8">
            {t('giveaway_recap.cta_subtitle')}
          </p>

          <div className="flex justify-center">
            <Button asChild size="lg" className="group">
              <Link to={getLocalePath('browse', lang)}>
                {t('giveaway_recap.cta_button')}
                <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            <Link
              to={getLocalePath('giveaway-feb-2026-rules', lang)}
              className="font-medium text-primary hover:underline"
            >
              {t('giveaway_recap.rules_link')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
