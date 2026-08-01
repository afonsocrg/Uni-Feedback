import { useTranslation } from 'react-i18next'
import type { GiveawayResults } from '~/lib/giveawayResults.server'
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
 * Two strips: the effort (people, reviews, words) and the spread (faculties,
 * degrees, courses). The spread is what earns the "we all won" claim above it,
 * since the first three numbers could describe a single degree.
 */
export function GiveawayDrawingStats({ totals }: GiveawayDrawingStatsProps) {
  const { t } = useTranslation('legal')

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

          {/* The spread, under the effort. "We all won" is a claim about how far
              this reached, and people/reviews/words alone do not say that: they
              could all be one degree. The faculty, degree and course counts are
              what make the claim checkable. Not emphasised, so the headline
              strip above still carries the section. */}
          <div className="mt-6">
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

          {/* No "see the full results" link any more: the leaderboard renders
              directly below this block, and the page it used to point at is now
              a redirect back here. */}
        </div>
      </div>
    </section>
  )
}
