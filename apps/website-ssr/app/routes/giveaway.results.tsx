import { isGiveawayActive } from '@uni-feedback/utils'
import { useEffect } from 'react'
import {
  GiveawayResultsCTA,
  GiveawayResultsDegrees,
  // GiveawayResultsFaculties, // see the commented-out section below
  GiveawayResultsHero,
  GiveawayResultsStats,
  GiveawayResultsWinner
} from '~/components/giveaway'
import { getGiveawayResults } from '~/lib/giveawayResults.server'
import { formatCount } from '~/utils'
import { analytics } from '~/utils/analytics'
import { detectLang, getLocalePath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/giveaway.results'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'legal')
  const lang = detectLang(location.pathname)
  const { origin, results } = loaderData

  return buildMeta({
    matches,
    title: t('giveaway_results.meta_title'),
    // The counts go in the description on purpose: this link gets pasted into
    // WhatsApp groups, and the preview is where most people read the numbers.
    description: t('giveaway_results.meta_desc', {
      reviews: formatCount(results.totals.reviews, lang),
      contributors: formatCount(results.totals.contributors, lang)
    }),
    url: `${origin}${getLocalePath('giveaway-results', lang)}`,
    image: {
      url: `${origin}/giveaway/og-${lang}.png`,
      width: 1200,
      height: 630
    }
  })
}

/**
 * Read on every request, no cache. The counts are the point of the page: a
 * student who submits a review and comes back must see their degree's total
 * move. See the note in `giveawayResults.server.ts`.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const results = await getGiveawayResults()

  return {
    results,
    origin: getRequestOrigin(request),
    // Resolved here rather than in the components so the two copy states never
    // differ between the server render and hydration.
    giveawayActive: isGiveawayActive()
  }
}

export default function GiveawayResultsPage({
  loaderData
}: Route.ComponentProps) {
  const { results, giveawayActive } = loaderData

  // Entry event, and the denominator for every click below. Fires once per
  // page load; the counts ride along so a spike in views can be read against
  // what the page actually said at the time.
  useEffect(() => {
    analytics.giveaway.resultsViewed({
      giveawayActive,
      reviews: results.totals.reviews,
      contributors: results.totals.contributors,
      degreesListed: results.degrees.length
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <GiveawayResultsHero
        totals={results.totals}
        windowStart={results.windowStart}
        windowEnd={results.windowEnd}
        giveawayActive={giveawayActive}
      />
      <GiveawayResultsStats totals={results.totals} />
      {/* Above the lists: after 1 August this is what returning visitors came
          for, and burying it under the degree table would read as hiding it. */}
      <GiveawayResultsWinner giveawayActive={giveawayActive} />
      <GiveawayResultsDegrees degrees={results.degrees} />
      {/* Held back from the first published version, pending a rethink of how
          the faculty totals should read. The component and its query are intact
          and `results.faculties` is still in the loader payload, so putting it
          back is uncommenting this line. */}
      {/* <GiveawayResultsFaculties faculties={results.faculties} /> */}
      <GiveawayResultsCTA
        giveawayActive={giveawayActive}
        generatedAt={results.generatedAt}
      />
    </>
  )
}
