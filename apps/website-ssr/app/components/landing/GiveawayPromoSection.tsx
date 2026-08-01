import { Button } from '@uni-feedback/ui'
import type { GiveawayPhase } from '@uni-feedback/utils'
import { ArrowRight, BarChart3, CalendarClock, Gift } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { GiveawayCountdown } from '~/components/giveaway'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'

interface GiveawayPromoSectionProps {
  /** Resolved in the landing loader so the copy never flips between SSR and
   * hydration, and so the band changes at midnight without a deploy. */
  phase: GiveawayPhase
}

/**
 * Promo band on the landing page.
 *
 * Follows the campaign page's phase for the same reason the hero does: once the
 * window closes, a band still selling "enter now" is an ask nobody can act on.
 * Closed, it says so and sends people to the results, which is the only thing
 * left to look at.
 *
 * `announced` is its own state and not folded into `ended`. Collapsing the two
 * is what left this band saying "estamos a sortear os 3 vencedores" after the
 * draw had already happened: on the busiest page on the site, promising an
 * announcement that is already published.
 */
export function GiveawayPromoSection({ phase }: GiveawayPromoSectionProps) {
  const lang = useLang()
  const { t } = useTranslation('landing')
  const { t: tGiveaway } = useTranslation('legal')
  const ended = phase !== 'active'
  const announced = phase === 'announced'

  return (
    <section className="relative overflow-hidden mb-12 bg-gradient-to-br from-slate-900 to-zinc-800">
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-white">
          <div className="flex items-center gap-4 md:gap-6 text-center md:text-left">
            <div className="hidden sm:flex items-center justify-center size-16 md:size-20 rounded-full bg-white/10 backdrop-blur-sm">
              <Gift className="size-8 md:size-10" />
            </div>
            <div>
              <p className="text-sm md:text-base font-medium uppercase tracking-wide text-white/80 mb-1">
                {t('giveaway_promo.eyebrow')}
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight mb-2">
                {announced ? (
                  t('giveaway_promo.title_announced')
                ) : ended ? (
                  t('giveaway_promo.title_ended')
                ) : (
                  <Trans
                    i18nKey="giveaway_promo.title"
                    ns="landing"
                    components={{ fnac: <span className="text-fnac" /> }}
                  />
                )}
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90">
                {t(
                  announced
                    ? 'giveaway_promo.subtitle_announced'
                    : ended
                      ? 'giveaway_promo.subtitle_ended'
                      : 'giveaway_promo.subtitle'
                )}
              </p>
              {/* The countdown renders nothing once expired, so the closed band
                  keeps the line with the end date instead of a gap. Nothing once
                  the winners are out: "estamos a sortear" is exactly the claim
                  that stopped being true. */}
              {!announced && (
                <div className="mt-3 flex justify-center md:justify-start">
                  {ended ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold whitespace-nowrap text-white">
                      <CalendarClock className="size-4 shrink-0" />
                      {tGiveaway('giveaway_page.drawing_badge')}
                    </span>
                  ) : (
                    <GiveawayCountdown variant="compact" />
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 shadow-xl shrink-0 text-lg px-8 py-2 h-auto"
            asChild
          >
            {ended ? (
              // Always the campaign page: it is the wrap-up now, carrying the
              // winners, the totals and the leaderboard. /giveaway/results only
              // still exists as a redirect for links already in the wild.
              <Link
                to={getLocalePath('giveaway', lang)}
                onClick={() =>
                  analytics.giveaway.resultsLinkClicked({
                    source: announced
                      ? 'landing_promo_announced'
                      : 'landing_promo_ended',
                    referrerPage: getPageName(window.location.pathname)
                  })
                }
              >
                <BarChart3 className="size-5" />
                {t(
                  announced
                    ? 'giveaway_promo.cta_announced'
                    : 'giveaway_promo.cta_ended'
                )}
              </Link>
            ) : (
              <Link to={getLocalePath('giveaway', lang)}>
                {t('giveaway_promo.cta')}
                <ArrowRight className="size-5" />
              </Link>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
