import { Button } from '@uni-feedback/ui'
import type { GiveawayPhase } from '@uni-feedback/utils'
import { ArrowRight, BarChart3, CalendarClock } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'
import { GiveawayCountdown } from './GiveawayCountdown'

interface GiveawayHeroSectionProps {
  /** Resolved in the loader so the copy never flips between SSR and hydration. */
  phase: GiveawayPhase
}

/**
 * Where the hero's "see the results" scrolls to once everything lives on this
 * page. Exported so the route sets the id from the same constant and the two
 * cannot drift into a link that scrolls nowhere.
 */
export const GIVEAWAY_RESULTS_ANCHOR = 'resultados'

/**
 * Opening block of the campaign page.
 *
 * Three states. While the ask is live this sells entering: prize headline, live
 * countdown, "how to participate". Once the window closes it becomes the status
 * board, because this is the URL in the Instagram bio and on every banner, and a
 * closed campaign still selling entries is the one thing it must never do. Once
 * the winners are out it becomes the wrap-up, and this page is the wrap-up: the
 * winners are announced directly below rather than one click away.
 *
 * The active/closed flip is on the clock; the closed/announced flip is on
 * `GIVEAWAY_WINNERS_ANNOUNCED`, since only a human knows the draw has been run.
 *
 * `drawing` still means "the window has shut", which is what the shared closed
 * styling keys off. `announced` narrows that to "and the winners are published",
 * so the two must not be collapsed back into one boolean: doing that is what
 * left this hero promising an announcement that had already happened.
 */
export function GiveawayHeroSection({ phase }: GiveawayHeroSectionProps) {
  const lang = useLang()
  const { t } = useTranslation('legal')
  const drawing = phase !== 'active'
  const announced = phase === 'announced'

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-zinc-800">
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
      <div className="relative z-10 container mx-auto px-4 py-24 text-center text-white">
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-sm md:text-base font-semibold uppercase tracking-wide text-white/80 drop-shadow-md">
            {t('giveaway_page.edition_name')}
          </p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-lg">
            {announced ? (
              t('giveaway_page.hero_title_announced')
            ) : drawing ? (
              t('giveaway_page.hero_title_drawing')
            ) : (
              <Trans
                i18nKey="giveaway_page.hero_title"
                ns="legal"
                components={{ fnac: <span className="text-fnac" /> }}
              />
            )}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">
            {t(
              announced
                ? 'giveaway_page.hero_subtitle_announced'
                : drawing
                  ? 'giveaway_page.hero_subtitle_drawing'
                  : 'giveaway_page.hero_subtitle'
            )}
          </p>

          {/* The countdown renders nothing once expired, so without this the
              closed hero would just lose the line and leave a gap where the
              deadline was.

              Nothing here once the winners are out. "Acabou a 31 de julho" was
              answering "can I still enter?", and the winners sitting directly
              below already answer it; kept, it is the loudest thing in the hero
              and it is about the least interesting fact on the page. */}
          {!drawing && <GiveawayCountdown className="pt-2" />}
          {drawing && !announced && (
            <div className="flex justify-center pt-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-base font-semibold text-white backdrop-blur-sm sm:text-lg">
                <CalendarClock className="size-5 shrink-0" />
                {t('giveaway_page.drawing_badge')}
              </span>
            </div>
          )}

          <div className="pt-4 space-y-3">
            {/* Closed, the results are the only thing left to look at, so they
                take the button the entry ask used to have. */}
            <Button
              size="lg"
              className="text-lg px-8 bg-white text-black hover:bg-white/90 shadow-xl"
              asChild
            >
              {drawing ? (
                // Scrolls rather than navigates: everything it promises is on
                // this page now. There is no separate results page to send
                // anyone to, and jumping away would skip the winners.
                <a
                  href={`#${GIVEAWAY_RESULTS_ANCHOR}`}
                  onClick={() =>
                    analytics.giveaway.resultsLinkClicked({
                      source: announced
                        ? 'giveaway_hero_announced'
                        : 'giveaway_hero_drawing',
                      referrerPage: getPageName(window.location.pathname)
                    })
                  }
                >
                  <BarChart3 className="size-5" />
                  {t('giveaway_page.hero_cta_results_ended')}
                </a>
              ) : (
                <a href="#how-to-win">
                  {t('giveaway_page.hero_cta_how')}
                  <ArrowRight className="size-5" />
                </a>
              )}
            </Button>
            {/* Results first and with an icon, rules second and plain: the
                results page is what most people who land here want to see, and
                it is the only proof on the page that anyone is taking part. */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
              {!drawing && (
                <Link
                  to={getLocalePath('giveaway-results', lang)}
                  onClick={() =>
                    analytics.giveaway.resultsLinkClicked({
                      source: 'giveaway_hero',
                      referrerPage: getPageName(window.location.pathname)
                    })
                  }
                  className="inline-flex items-center gap-1.5 font-medium text-white hover:text-white underline underline-offset-4"
                >
                  <BarChart3 className="size-4 shrink-0" />
                  {t('giveaway_page.hero_cta_results')}
                </Link>
              )}
              <Link
                to={getLocalePath('giveaway-rules', lang)}
                className="text-white/90 hover:text-white underline"
              >
                {t('giveaway_page.hero_cta_rules')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
