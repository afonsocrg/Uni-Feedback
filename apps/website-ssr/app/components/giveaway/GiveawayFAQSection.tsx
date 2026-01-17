import { Link } from 'react-router'

import { FAQ, type FAQItem } from '~/components/landing'

const GIVEAWAY_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How exactly is the winner selected?',
    answer:
      'We use a weighted random draw. Think of it like a raffle: every point you earn is one "ticket" with your name on it. If you have 20 points, your name goes into the digital hat 20 times.'
  },
  {
    question: 'How do I get more points?',
    answer:
      'You earn up to 20 points for each approved course review you submit. You can also share your referral link from your profile. When a friend signs up and submits their first approved feedback, you get bonus points! More info [here](/points).'
  },
  {
    question: 'When will I know if I won?',
    answer:
      'The giveaway ends on **February 27th at 23:59**. The winner will be contacted via their university email and publicly announced on our Instagram on **March 2nd**. Make sure to check your inbox (and spam folder)! By participating, you agree to have your first name, last initial, and university shared if you win.'
  },
  {
    question: 'Is my feedback really anonymous?',
    answer:
      "100% yes. Professors and other students will never see your name or email attached to your reviews. We only use your email to verify you're a real student and to send you the prize if you win."
  },
  {
    question: 'What if I already submitted feedback before the giveaway?',
    answer:
      "You're one of our OGs! Your points still count. Just make sure you log in to the platform at least once before the February 27th deadline to activate your entry for this draw."
  },
  {
    question: 'Do all reviews count?',
    answer:
      "For fairness, only feedback on courses taken this year counts for the giveaway. You'll still earn points for feedback from previous years."
  },
  {
    question: "I'm doing Erasmus in Lisbon, can I participate?",
    answer:
      "If you have a valid @tecnico.ulisboa.pt, @novasbe.pt, @fct.unl.pt, or @novaims.unl.pt email address and are currently enrolled, you're in!"
  },
  {
    question: 'Why do I need to log in with my university email?',
    answer:
      'To ensure all feedback is legitimate and comes from real students. This protects the quality of the platform for everyone.'
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
