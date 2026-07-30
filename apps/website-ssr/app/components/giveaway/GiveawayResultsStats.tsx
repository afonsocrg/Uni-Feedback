import { useTranslation } from 'react-i18next'
import type { GiveawayResults } from '~/lib/giveawayResults.server'
import { GiveawayResultsNumbers } from './GiveawayResultsNumbers'

interface GiveawayResultsStatsProps {
  totals: GiveawayResults['totals']
}

/**
 * What the month produced, as three numbers.
 *
 * The order is the story and not an arrangement: people first, then what those
 * people wrote, then how much of it. Reading left to right you get a sentence,
 * "this many of us wrote this many reviews, and that came to this many words",
 * which is the one thing the page has to land before anything else on it.
 *
 * The spread (faculties, degrees, courses) deliberately does NOT live here. It
 * answers a different question, "where did this come from", and it is the setup
 * for the leaderboard, so it sits down there. See `GiveawayResultsReach`.
 */
export function GiveawayResultsStats({ totals }: GiveawayResultsStatsProps) {
  const { t } = useTranslation('legal')

  return (
    <section className="bg-background pt-2 pb-6">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
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
        </div>
      </div>
    </section>
  )
}
