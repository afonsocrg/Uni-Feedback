import { Link } from 'react-router'

import { FAQ, type FAQItem } from '~/components/landing'

const GIVEAWAY_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do I enter and get more points?',
    answer:
      'You earn up to 20 points for each feedback you submit. You can also share your referral link from your profile. When a friend signs up and submits their first feedback, you get bonus points! More info [here](/points).'
  },
  {
    question: 'Does feedback from previous years still count?',
    answer:
      'To keep things fair, only feedback for courses taken during the first term of 2025/2026 counts as entries for this giveaway. However, you still earn permanent points on your profile for older courses!'
  },
  {
    // REPHRASED: More "relatable"
    question: 'I submitted feedback before the giveaway. Does that count?',
    answer:
      "You're one of our OGs! If you've submitted feedback for the first term of 2025/2026, it will count for the giveaway. You just need to [log in](/login) at least once before February 27th to activate your entry for the giveaway."
  },
  {
    question: 'How exactly is the winner selected?',
    answer:
      'The winner is picked at random. Having more points gives you more chances to win.'
  },
  {
    question: 'Can Erasmus or international students participate?',
    answer:
      "Yes! If you have a valid @tecnico.ulisboa.pt, @novasbe.pt, @fct.unl.pt, or @novaims.unl.pt email address and are currently enrolled, you're in!"
  },
  {
    question: 'Why do I need to use my university email?',
    answer:
      'To ensure all feedback is legitimate and comes from real students. This protects the quality of the platform for everyone.'
  },
  {
    question: 'Is my feedback really anonymous?',
    answer:
      "100% yes. Professors and other students will never see your name or email attached to your reviews. We only use your email to verify you're a real student and to contact the winner."
  },
  {
    question: 'When will the winner be announced?',
    answer:
      'The giveaway ends on **February 27th at 23:59**. We will contact the winner via university email and announce them on our [Instagram](https://www.instagram.com/unifeedback/) on **March 2nd**. Check your spam folder!'
  }
]

export function GiveawayFAQSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
            Everything You Need to Know
          </h2>
          <p className="text-center text-muted-foreground mb-4">
            Here are the most common questions about the giveaway. For all the
            details, check the{' '}
            <Link
              to="/giveaway/rules"
              className="underline hover:text-foreground"
            >
              official rules
            </Link>
          </p>
          <FAQ items={GIVEAWAY_FAQ_ITEMS} />
        </div>
      </div>
    </section>
  )
}
