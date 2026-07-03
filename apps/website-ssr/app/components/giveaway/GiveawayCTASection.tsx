import { Button } from '@uni-feedback/ui'
import { PenSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'
import { GiveawayCountdown } from './GiveawayCountdown'

export function GiveawayCTASection() {
  const lang = useLang()
  const { t } = useTranslation('legal')

  return (
    <section className="py-16 md:py-24 bg-brand-emphasis text-brand-emphasis-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="flex justify-center">
            <GiveawayCountdown variant="compact" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            {t('giveaway_page.cta_title')}
          </h2>
          <p className="text-lg text-brand-emphasis-foreground/90">
            {t('giveaway_page.cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 shadow-xl"
              asChild
            >
              <a
                href={`${getReviewPath(lang)}?from=giveaway`}
                onClick={() => {
                  analytics.navigation.feedbackFormLinkClicked({
                    source: 'giveaway_cta',
                    referrerPage: getPageName(window.location.pathname)
                  })
                }}
              >
                <PenSquare className="size-5" />
                {t('giveaway_page.cta_button')}
              </a>
            </Button>
          </div>

          <div className="pt-8 text-sm text-brand-emphasis-foreground/80">
            <span>{t('giveaway_page.past_editions')}: </span>
            <Link
              to={getLocalePath('giveaway-feb-2026', lang)}
              className="font-medium underline hover:text-brand-emphasis-foreground"
            >
              {t('giveaway_page.past_edition_feb_2026')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
