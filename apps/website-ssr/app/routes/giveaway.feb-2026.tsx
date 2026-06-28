import {
  GiveawayRecapCommunity,
  GiveawayRecapCTA,
  GiveawayRecapHero,
  GiveawayRecapThankYou,
  GiveawayRecapWinner
} from '~/components/giveaway'

export function meta() {
  return [
    { title: 'Giveaway Recap (Feb 2026) - Thank You! | Uni Feedback' },
    {
      name: 'description',
      content:
        'Thank you to everyone who participated in the February 2026 Uni Feedback giveaway (NOS Alive 2026)! See what we accomplished together.'
    }
  ]
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
