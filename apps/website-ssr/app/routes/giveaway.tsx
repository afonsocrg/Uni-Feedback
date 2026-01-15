import { Link } from 'react-router'

import { GiveawayHeroSection, HowToWinSection } from '~/components/giveaway'
import { FAQ, type FAQItem } from '~/components/landing'

import type { Route } from './+types/giveaway'

const GIVEAWAY_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'I already submitted reviews earlier this year. Am I included?',
    answer:
      "Yes! You are one of our OGs! When you login for the first time, you will be awarded for all the feedbacks you've submitted!"
  },
  {
    question: 'Which courses can I review for the giveaway?',
    answer:
      'For the giveaway, we will only consider points awarded to feedback given to courses you took this year. However, the more feedback you give, the more you help other students!'
  },
  {
    question: 'How do points work?',
    answer:
      'You earn up to 20 points for each feedback you submit. You can also earn points by inviting your friends! More information [here](/points)'
  },
  {
    question: 'How does the referral system work?',
    answer:
      'Share your referral link from your profile. When a friend signs up and submits their first approved feedback, you get bonus points! More info [here](/points)'
  },
  {
    question: 'Why do I need to log in with my university email?',
    answer:
      'To ensure all feedback is legitimate and comes from real students. This protects the quality of the platform for everyone.'
  },
  {
    question: 'Is my feedback really anonymous?',
    answer:
      'Yes. We only use your email to verify you are a student at one of our supported universities. Your name is never linked to your reviews on the platform.'
  },
  {
    question: 'When and how is the winner announced?',
    answer:
      'The giveaway ends on **February 27th at 23:59**. The winner will be notified via email and publicly announced on our Instagram on **March 2nd**. By participating, you agree to have your first name, last initial, and university shared if you win.'
  }
]

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'NOS Alive 2026 Giveaway | Uni Feedback' },
    {
      name: 'description',
      content:
        'Win a ticket to NOS Alive 2026! Share your course feedback and enter our giveaway.'
    }
  ]
}

export default function GiveawayPage() {
  return (
    <>
      <GiveawayHeroSection />
      <HowToWinSection />
      <FAQ
        items={GIVEAWAY_FAQ_ITEMS}
        title="Everything You Need to Know"
        subtitle="Frequently asked questions about the giveaway"
      />
      <div className="bg-muted/30 pb-16 text-center">
        <p className="text-muted-foreground">
          Want the full details?{' '}
          <Link
            to="/giveaway/rules"
            className="underline hover:text-foreground"
          >
            Check out the official rules
          </Link>
        </p>
      </div>
    </>
  )
}
