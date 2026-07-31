import { getGiveawayPhase, GIVEAWAY_PHASES } from '@uni-feedback/utils'
import {
  GiveawayCTASection,
  GiveawayDrawingStats,
  GiveawayFAQSection,
  GiveawayHeroSection,
  GiveawayPointsSection,
  GiveawayPrizesSection,
  HowToWinSection
} from '~/components/giveaway'
import { i18n } from '~/i18n/config'
import { getClosedGiveawayTotals } from '~/lib/giveawayResults.server'
import { detectLang } from '~/utils/i18n-routes'
import { buildMeta } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/giveaway'

/**
 * The phase is resolved here rather than in the components so the campaign copy
 * cannot differ between the server render and hydration, and so the page flips at
 * midnight on its own. See `getGiveawayPhase`.
 *
 * The totals are only read once the window has closed, because that is the only
 * state that shows them, and they come from the cached accessor: this page gets
 * far more traffic than the results page and the numbers can no longer move.
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
  const totals = phase === 'active' ? null : await getClosedGiveawayTotals()

  return { origin, lang, phase, totals }
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
  const drawing = phase !== 'active'

  return buildMeta({
    title: t(drawing ? 'giveaway.meta_title_drawing' : 'giveaway.meta_title'),
    description: t(
      drawing ? 'giveaway.meta_desc_drawing' : 'giveaway.meta_desc'
    ),
    url: `${origin}/giveaway`,
    image: {
      url: `${origin}/giveaway/og-${lang}.png`,
      width: 1200,
      height: 630
    }
  })
}

export default function GiveawayPage({ loaderData }: Route.ComponentProps) {
  const { phase, totals } = loaderData

  return (
    <>
      <GiveawayHeroSection phase={phase} />

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
        totals && <GiveawayDrawingStats totals={totals} />
      )}

      <GiveawayFAQSection />
      <GiveawayCTASection phase={phase} />
    </>
  )
}
