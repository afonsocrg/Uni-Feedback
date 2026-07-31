import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import type { GiveawayResults } from '~/lib/giveawayResults.server'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'
import { GiveawayResultsNumbers } from './GiveawayResultsNumbers'

interface GiveawayDrawingStatsProps {
  totals: GiveawayResults['totals']
}

/**
 * What the campaign produced, on the campaign page, once the window has closed.
 *
 * This takes the slot the "how to participate" and points sections held while
 * the ask was live. Those are instructions for something nobody can do any more;
 * a closed campaign page needs proof instead, and the numbers are the proof.
 *
 * Three numbers and a link, deliberately not the leaderboard. Duplicating the
 * degree table here would make the results page pointless and double what has to
 * be maintained; the whole job of this block is to be worth clicking through.
 */
export function GiveawayDrawingStats({ totals }: GiveawayDrawingStatsProps) {
  const { t } = useTranslation('legal')
  const lang = useLang()

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-3">
            {t('giveaway_page.drawing_stats_title')}
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            {t('giveaway_page.drawing_stats_desc')}
          </p>

          {/* Same three labels as the results page's own strip, on purpose: the
              two pages are read minutes apart and a student who notices them
              disagreeing has no way to tell which one is lying. */}
          <GiveawayResultsNumbers
            emphasis
            items={[
              {
                value: totals.contributors,
                label: t('giveaway_results.stats_contributors')
              },
              {
                value: totals.reviews,
                label: t('giveaway_results.stats_reviews')
              },
              {
                value: totals.words,
                label: t('giveaway_results.stats_words')
              }
            ]}
          />

          <div className="mt-8 flex justify-center">
            <Link
              to={getLocalePath('giveaway-results', lang)}
              onClick={() =>
                analytics.giveaway.resultsLinkClicked({
                  source: 'giveaway_drawing_stats',
                  referrerPage: getPageName(window.location.pathname)
                })
              }
              className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t('giveaway_page.drawing_stats_link')}
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
