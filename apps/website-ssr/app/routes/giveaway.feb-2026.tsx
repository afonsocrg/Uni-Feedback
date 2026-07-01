import {
  GiveawayRecapCommunity,
  GiveawayRecapCTA,
  GiveawayRecapHero,
  GiveawayRecapThankYou,
  GiveawayRecapWinner
} from '~/components/giveaway'
import { buildMeta, metaT } from '~/utils/meta'
import type { Route } from './+types/giveaway.feb-2026'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'legal')
  return buildMeta({
    matches,
    title: t('giveaway_recap.meta_title'),
    description: t('giveaway_recap.meta_desc')
  })
}

export default function GiveawayFeb2026Page() {
  return (
    <>
      <GiveawayRecapHero />
      <GiveawayRecapThankYou />
      <GiveawayRecapWinner />
      <GiveawayRecapCommunity />
      <GiveawayRecapCTA />
    </>
  )
}
