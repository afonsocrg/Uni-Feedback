import {
  GiveawayCTASection,
  GiveawayFAQSection,
  GiveawayHeroSection,
  GiveawayPointsSection,
  GiveawayPrizesSection,
  HowToWinSection
} from '~/components/giveaway'

export function meta() {
  return [
    { title: 'Uni Feedback Giveaway: Win €50 at FNAC' },
    {
      name: 'description',
      content:
        'Share feedback on your courses for a chance to win one of 3 × €50 FNAC gift cards. Ends July 31, 2026.'
    }
  ]
}

export default function GiveawayPage() {
  return (
    <>
      <GiveawayHeroSection />
      <HowToWinSection />
      <GiveawayPrizesSection />
      <GiveawayPointsSection />
      <GiveawayFAQSection />
      <GiveawayCTASection />
    </>
  )
}
