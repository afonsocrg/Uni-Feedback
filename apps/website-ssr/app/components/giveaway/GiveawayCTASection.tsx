import { Button } from '@uni-feedback/ui'
import type { GiveawayPhase } from '@uni-feedback/utils'
import { PenSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'
import { GiveawayCountdown } from './GiveawayCountdown'

interface GiveawayCTASectionProps {
  /** Resolved in the loader, like the hero's. */
  phase: GiveawayPhase
}

/**
 * Closing band.
 *
 * The feedback ask stays after the window closes, but the reason for it changes:
 * no points, no deadline, no prize, just that the reviews are what the site is
 * for. Same call the results page makes in its ended state. Dropping the button
 * entirely would leave the page with no action at all for the Instagram traffic
 * that keeps arriving here for days after the draw.
 */
export function GiveawayCTASection({ phase }: GiveawayCTASectionProps) {
  const lang = useLang()
  const { t } = useTranslation('legal')
  const drawing = phase !== 'active'

  return (
    <section className="py-16 md:py-24 bg-brand-emphasis text-brand-emphasis-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {!drawing && (
            <div className="flex justify-center">
              <GiveawayCountdown variant="compact" />
            </div>
          )}
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            {t(
              drawing
                ? 'giveaway_page.cta_title_drawing'
                : 'giveaway_page.cta_title'
            )}
          </h2>
          <p className="text-lg text-brand-emphasis-foreground/90">
            {t(
              drawing
                ? 'giveaway_page.cta_subtitle_drawing'
                : 'giveaway_page.cta_subtitle'
            )}
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
                    source: drawing ? 'giveaway_cta_drawing' : 'giveaway_cta',
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
