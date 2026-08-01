import { getGiveawayPhase, GIVEAWAY_PHASES } from '@uni-feedback/utils'
import {
  GIVEAWAY_RESULTS_ANCHOR,
  GiveawayCTASection,
  GiveawayDrawingStats,
  GiveawayFAQSection,
  GiveawayHeroSection,
  GiveawayPointsSection,
  GiveawayPrizesSection,
  GiveawayResultsDegrees,
  GiveawayWinners,
  HowToWinSection
} from '~/components/giveaway'
import { i18n } from '~/i18n/config'
import { getClosedGiveawayResults } from '~/lib/giveawayResults.server'
import { detectLang } from '~/utils/i18n-routes'
import { buildMeta } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/giveaway'

/**
 * The phase is resolved here rather than in the components so the campaign copy
 * cannot differ between the server render and hydration, and so the page flips at
 * midnight on its own. See `getGiveawayPhase`.
 *
 * The results are only read once the window has closed, because that is the only
 * state that shows them, and they come from the cached accessor: this page gets
 * far more traffic than the results page and the numbers can no longer move.
 * Totals AND degrees, since the leaderboard now lives here too.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const origin = getRequestOrigin(request)
  const lang = detectLang(url.pathname)

  // `?phase=drawing` previews the closed page before the window actually shuts.
  // Dev only: in production this state is the announcement everyone is waiting
  // for, and a URL that fakes it is a URL that gets screenshotted and shared.
  const requested = import.meta.env.DEV ? url.searchParams.get('phase') : null
  const override = GIVEAWAY_PHASES.find((candidate) => candidate === requested)
  const phase = override ?? getGiveawayPhase()
  const results = phase === 'active' ? null : await getClosedGiveawayResults()

  return { origin, lang, phase, results }
}

/**
 * The preview follows the phase for the same reason the hero does: this URL is
 * what gets pasted into WhatsApp groups, and after the close the entry pitch
 * ("win €50, share your feedback") is an ask nobody can act on. The OG image is
 * static and still carries the prize, which is fine: it is the poster for the
 * campaign, and the campaign did happen.
 */
export function meta({ loaderData }: Route.MetaArgs) {
  const { origin, lang, phase } = loaderData
  const t = i18n.getFixedT(lang, 'legal')

  // Three variants, because the preview is the whole message for most people who
  // see this link. "Winners coming up" left standing after the draw is the same
  // mistake as the hero: it promises something that already happened.
  const title = {
    active: 'giveaway.meta_title',
    drawing: 'giveaway.meta_title_drawing',
    announced: 'giveaway.meta_title_announced'
  } as const
  const description = {
    active: 'giveaway.meta_desc',
    drawing: 'giveaway.meta_desc_drawing',
    announced: 'giveaway.meta_desc_announced'
  } as const

  return buildMeta({
    title: t(title[phase]),
    description: t(description[phase]),
    url: `${origin}/giveaway`,
    image: {
      url: `${origin}/giveaway/og-${lang}.png`,
      width: 1200,
      height: 630
    }
  })
}

export default function GiveawayPage({ loaderData }: Route.ComponentProps) {
  const { phase, results } = loaderData

  return (
    <>
      <GiveawayHeroSection phase={phase} />

      {/* The winners come before the totals, and on this page rather than only
          on /giveaway/results. This is the URL in the Instagram bio and on every
          banner, so it is where people arrive to find out who won; making them
          click through to learn the one thing they came for is how a wrap-up
          reads as a hedge. The results page keeps the full breakdown. */}
      {/* The anchor sits on the wrapper, not on the winners, so the hero's
          "see the results" lands on the first thing after it in either closed
          phase: the winners once they are out, the totals before that. */}
      <div id={GIVEAWAY_RESULTS_ANCHOR} className="scroll-mt-20">
        {phase === 'announced' && (
          <section className="bg-background pt-12 md:pt-16">
            <div className="container mx-auto px-4">
              <GiveawayWinners />
            </div>
          </section>
        )}

        {/* Once the window closes the entire entry pitch goes, not just its
          wording: the how-to and the points table are instructions for earning
          entries, and the prizes block is a pitch for entering. Nothing makes
          those honest after the deadline. What is left is what happened, and the
          rules page still documents how the scoring worked for anyone checking
          the draw. */}
        {phase === 'active' ? (
          <>
            <HowToWinSection />
            <GiveawayPrizesSection />
            <GiveawayPointsSection />
          </>
        ) : (
          results && (
            <>
              <GiveawayDrawingStats totals={results.totals} />
              {/* The leaderboard moved here from the results page. After the
                winners, "what we built together" is the answer to the question
                the winners raise: three people got cards, so what did the other
                few hundred get out of it. The degrees are that answer. */}
              <GiveawayResultsDegrees degrees={results.degrees} />
            </>
          )
        )}
      </div>

      <GiveawayFAQSection />
      <GiveawayCTASection phase={phase} />
    </>
  )
}
