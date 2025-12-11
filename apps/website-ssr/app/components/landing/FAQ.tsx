import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@uni-feedback/ui'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does Uni Feedback ensure reviews are authentic?',
    answer:
      'We verify that all reviewers are enrolled students through a secure authentication process. While feedback remains anonymous, we ensure only legitimate students can contribute reviews.'
  },
  {
    question: 'Is my feedback really anonymous?',
    answer:
      'Yes, absolutely. Your identity is never revealed to anyone, including professors, administrators, or other students. We take privacy seriously and use encryption to protect all user data.'
  },
  {
    question: 'Can I review any course from any university?',
    answer:
      "Currently, we support courses from partner universities. If your university isn't listed, you can request to add it, and we'll work on expanding our coverage."
  },
  {
    question: 'How can I trust the reviews are honest?',
    answer:
      "Anonymity encourages honesty. Students can share their genuine experiences without fear of repercussions. We also moderate reviews to ensure they meet our quality standards and aren't spam or abusive."
  },
  {
    question: 'Is Uni Feedback free to use?',
    answer:
      'Yes, Uni Feedback is completely free for all students. Our mission is to help students make better academic decisions, and we believe this information should be accessible to everyone.'
  }
]

export function FAQ() {
  const items = FAQ_ITEMS
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
          <Accordion type="single" className="space-y-4" collapsible>
            {items.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index + 1}`}
                className="bg-background rounded-lg px-6 border"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
