import {
  getGiveawayPhase,
  GIVEAWAY_PHASES,
  isGiveawayActive
} from '@uni-feedback/utils'
import { useEffect } from 'react'
import { useRevalidator } from 'react-router'
import {
  GiveawayResultsCTA,
  GiveawayResultsDegrees,
  // GiveawayResultsFaculties, // see the commented-out section below
  GiveawayResultsHero,
  GiveawayResultsReach,
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

/**
 * How often the counts are re-read while the giveaway is running. Each tick is
 * the three aggregates in `getGiveawayResults()`, so this is a per-open-tab
 * database cost: lower it and every concurrent viewer multiplies the load.
 */
const POLL_MS = 15_000

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

  // `?phase=drawing` previews the closed page before the window actually shuts,
  // dev only. Same override as the campaign page, and it moves `giveawayActive`
  // with it so the preview is the whole page and not half of it.
  const requested = import.meta.env.DEV
    ? new URL(request.url).searchParams.get('phase')
    : null
  const override = GIVEAWAY_PHASES.find((candidate) => candidate === requested)

  return {
    results,
    origin: getRequestOrigin(request),
    // Resolved here rather than in the components so the two copy states never
    // differ between the server render and hydration.
    giveawayActive: override ? override === 'active' : isGiveawayActive(),
    // The winner block is the one part of this page with three states rather
    // than two: waiting, being drawn, announced. Everything else only cares
    // whether the campaign is still running.
    phase: override ?? getGiveawayPhase()
  }
}

export default function GiveawayResultsPage({
  loaderData
}: Route.ComponentProps) {
  const { results, giveawayActive, phase } = loaderData
  // Destructured because `revalidate` is stable while the revalidator object is
  // not: depending on the object would tear down and restart the timer on every
  // poll, since its `state` changes each time one runs.
  const { revalidate } = useRevalidator()

  // Live counts. The loader already reads the database with no cache, so
  // re-running it is the whole refresh: a student who submits a review and
  // leaves this page open sees their degree's total move without reloading.
  //
  // Only while the giveaway is running; once it closes the numbers are frozen
  // and polling would be pure load. Paused on a hidden tab for the same reason.
  useEffect(() => {
    if (!giveawayActive) return

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') revalidate()
    }, POLL_MS)

    return () => clearInterval(id)
  }, [giveawayActive, revalidate])

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
      {/* First thing after the lede, and above every number on the page. On and
          after 1 August this is what returning visitors came for, and anywhere
          lower it reads as buried. It is an inset notice rather than a section,
          so the totals below still attach to the hero's sentence. */}
      <GiveawayResultsWinner phase={phase} />
      <GiveawayResultsStats totals={results.totals} />

      {/* The spread, then the leaderboard, in that order and adjacent: the
          faculty/degree/course totals are what stop the top ten reading as the
          whole field. Splitting them leaves the list without its denominator. */}
      <GiveawayResultsReach totals={results.totals} />
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
