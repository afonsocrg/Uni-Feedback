import { useTranslation } from 'react-i18next'
import { useCountUp, useLang } from '~/hooks'
import type { GiveawayResults } from '~/lib/giveawayResults.server'
import { formatCount } from '~/utils'

interface GiveawayResultsStatsProps {
  totals: GiveawayResults['totals']
}

/**
 * The six headline numbers, read as one strip rather than six cards.
 *
 * Separation is a single hairline per cell and nothing else: no frame, no card
 * background, no vertical rules. Horizontal rules alone survive every column
 * count, so the strip does not need per-breakpoint corrections and cannot leave
 * a stray divider next to a ragged last row.
 *
 * All six count up off ONE ramp (see `useCountUp`), so they land together and
 * the strip reads as a single reveal. `tabular-nums` is load-bearing here and
 * not just polish: without it every frame re-measures and the labels jitter
 * sideways for the whole animation.
 */
export function GiveawayResultsStats({ totals }: GiveawayResultsStatsProps) {
  const { t } = useTranslation('legal')
  const lang = useLang()
  const { ref, progress } = useCountUp<HTMLDListElement>()

  // Order is read across the 3-column grid: the top row widens out (faculties →
  // degrees → courses), the bottom row is what we actually produced (who wrote,
  // how many, how much). On the 2-column phone layout the pairs re-flow, which
  // is fine: the grouping is a nicety, not something a label depends on.
  const stats = [
    {
      value: totals.faculties,
      label: t('giveaway_results.stats_faculties')
    },
    { value: totals.degrees, label: t('giveaway_results.stats_degrees') },
    { value: totals.courses, label: t('giveaway_results.stats_courses') },
    {
      value: totals.contributors,
      label: t('giveaway_results.stats_contributors')
    },
    { value: totals.reviews, label: t('giveaway_results.stats_reviews') },
    { value: totals.words, label: t('giveaway_results.stats_words') }
  ]

  return (
    <section className="bg-background pb-6">
      <div className="container mx-auto px-4">
        <dl
          ref={ref}
          className="mx-auto grid max-w-4xl grid-cols-2 sm:grid-cols-3"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="border-t border-border py-4 pr-6">
              {/* aria-label carries the final value throughout: a screen reader
                  announcing every intermediate number would be unusable. */}
              <dd
                className="font-heading text-2xl font-bold tabular-nums tracking-tight md:text-3xl"
                aria-label={formatCount(stat.value, lang)}
              >
                <span aria-hidden="true">
                  {formatCount(Math.round(stat.value * progress), lang)}
                </span>
              </dd>
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
