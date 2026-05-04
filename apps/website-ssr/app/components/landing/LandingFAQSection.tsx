import { FAQ, type FAQItem } from './FAQ'

const LANDING_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Is Uni Feedback affiliated with my university?',
    answer:
      'No. This is a student-run platform, independent from any university. No institution controls what gets published here. Students share their honest experience freely.'
  },
  {
    question: 'Can professors see who wrote a review?',
    answer:
      "Professors can read reviews, yes. But they'll never know who wrote what. Your identity is never revealed to anyone. Not professors, not other students, not your university."
  },
  {
    question: 'How do I know reviews are real?',
    answer:
      'Every reviewer signs in with their institutional email before submitting. Your email is never displayed or shared.'
  },
  {
    question: 'How recent is the feedback?',
    answer:
      "The most recent reviews always appear first. Every review also shows which school year it's from, so you always know how old the feedback is."
  },
  {
    question: "My course isn't listed. What can I do?",
    answer:
      "[Reach out to me!](mailto:afonso@uni-feedback.com) I'll be happy to add your course, degree, or university."
  },
  {
    question: 'What language should I write my feedback in?',
    answer: "Write in the language you're most comfortable with."
  },
  {
    question: 'Do I need to create an account to submit feedback?',
    answer:
      'You need to authenticate with your university email to submit. When you do it for the first time, an account is automatically created.'
  },
  {
    question: 'How long until my review appears after I submit it?',
    answer:
      "Your feedback is published immediately. I read every submission. If something doesn't follow our guidelines, I'll reach out and let you know."
  },
  {
    question: 'Can I edit or delete my feedback after submitting?',
    answer:
      "Yes. Go to your [profile page](/profile) to see all the feedback you've submitted. You can edit or delete it from there."
  },
  {
    question: 'Who runs Uni Feedback? Is it a company?',
    answer:
      "Uni Feedback is run by me, Afonso. I'm someone who really wants to solve this problem and help students make more informed decisions."
  },
  {
    question: 'What happens if I see a review that seems fake or unfair?',
    answer:
      "You can report it. Whenever I receive a report, I'll re-evaluate the review and remove it if it doesn't follow our guidelines."
  },
  {
    question: 'Is Uni Feedback free?',
    answer: 'Yes. Completely free. For everyone.'
  }
]

export function LandingFAQSection() {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need to know about Uni Feedback
          </p>
          <FAQ items={LANDING_FAQ_ITEMS} />
          <p className="text-center text-sm text-muted-foreground mt-8">
            Have another question? Find me on{' '}
            <a
              href="https://instagram.com/unifeedback"
              className="text-primary hover:underline font-medium"
            >
              Instagram
            </a>{' '}
            or write to{' '}
            <a
              href="mailto:afonso@uni-feedback.com"
              className="text-primary hover:underline font-medium"
            >
              afonso@uni-feedback.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
