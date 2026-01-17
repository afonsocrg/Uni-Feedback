import { FAQ, type FAQItem } from './FAQ'

const LANDING_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Is Uni Feedback free to use?',
    answer:
      'Yes, Uni Feedback is completely free for everyone. Our mission is to help students make better academic decisions, and we believe this information should be accessible to everyone.'
  },
  {
    question: 'Why do I need to use my university email when giving feedback?',
    answer:
      'We require a university email solely to verify that feedback is coming from legitimate students. Your e-mail will never be displayed or shared with anyone.'
  },
  {
    question: 'Is my feedback really anonymous?',
    answer:
      'Yes, absolutely. Your identity is never revealed to anyone, including professors, administrators, or other students. We take privacy seriously.'
  },
  {
    question: 'Can I request that my university be added to Uni Feedback?',
    answer:
      "**Yes**! If your university isn't currently listed, you can easily submit a request [here](https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform). We prioritize adding universities with the highest demand."
  }
]

export function LandingFAQSection() {
  return (
    <section id="faq" className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need to know about Uni Feedback
          </p>
          <FAQ items={LANDING_FAQ_ITEMS} />
        </div>
      </div>
    </section>
  )
}
