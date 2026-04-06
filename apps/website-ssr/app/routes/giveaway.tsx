import {
  GiveawayRecapCommunity,
  GiveawayRecapCTA,
  GiveawayRecapHero,
  GiveawayRecapThankYou,
  GiveawayRecapWinner
} from '~/components/giveaway'

import type { Route } from './+types/giveaway'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Giveaway Recap - Thank You! | Uni Feedback' },
    {
      name: 'description',
      content:
        'Thank you to everyone who participated in the Uni Feedback giveaway! See what we accomplished together.'
    }
  ]
}

export default function GiveawayPage() {
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
