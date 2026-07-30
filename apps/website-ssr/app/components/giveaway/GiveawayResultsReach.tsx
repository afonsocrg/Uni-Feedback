import { useTranslation } from 'react-i18next'
import type { GiveawayResults } from '~/lib/giveawayResults.server'
import { GiveawayResultsNumbers } from './GiveawayResultsNumbers'

interface GiveawayResultsReachProps {
  totals: GiveawayResults['totals']
}

/**
 * How wide the month spread: faculties, degrees, courses.
 *
 * This exists to set up the leaderboard immediately below it, and that is why
 * it is not folded into the headline numbers at the top. The list shows the top
 * ten degrees; on its own that reads as "ten degrees took part". Putting the
 * full degree and faculty counts directly above it makes the list what it
 * actually is: the loudest few out of a much wider field.
 *
 * Which is also why it renders even when the degree list is empty or short. The
 * totals here come from the whole in-window slice, with none of the leaderboard
 * cuts (top ten, minimum contributors) applied, so they are the honest
 * denominator no matter how the list below turns out.
 *
 * Padded to sit tight against the leaderboard: it is that section's lead-in,
 * not a section of its own that happens to precede it.
 */
export function GiveawayResultsReach({ totals }: GiveawayResultsReachProps) {
  const { t } = useTranslation('legal')

  return (
    <section className="bg-background pt-10 pb-2">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
            {t('giveaway_results.reach_title')}
          </h2>
          <p className="mt-1 mb-4 max-w-2xl text-muted-foreground">
            {t('giveaway_results.reach_desc')}
          </p>

          <GiveawayResultsNumbers
            items={[
              {
                value: totals.faculties,
                label: t('giveaway_results.stats_faculties')
              },
              {
                value: totals.degrees,
                label: t('giveaway_results.stats_degrees')
              },
              {
                value: totals.courses,
                label: t('giveaway_results.stats_courses')
              }
            ]}
          />
        </div>
      </div>
    </section>
  )
}
