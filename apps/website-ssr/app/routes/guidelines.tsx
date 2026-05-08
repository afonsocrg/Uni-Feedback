import { Button } from '@uni-feedback/ui'
import { Link } from 'react-router'

export function meta() {
  return [
    { title: 'How to Write Great Feedback | Uni Feedback' },
    {
      name: 'description',
      content:
        'Learn how to write helpful, honest course reviews that actually help other students make better decisions.'
    }
  ]
}

const writingItems = [
  {
    lead: 'Talk about whatever felt relevant to you.',
    body: "If something stood out during your time in the course (good or bad), it's probably relevant to other students too. Based on the feedback we've collected, students tend to care about teaching, assessment, materials, and tips. But don't feel limited to these. Cover what actually mattered to you."
  },
  {
    lead: 'Be specific.',
    body: 'Vague opinions don\'t help anyone decide anything. "The midterm covered 3 weeks of content with no practice problems beforehand" is ten times more useful than "midterms were unfair." That includes naming professors when relevant, especially when you\'re praising someone.'
  },
  {
    lead: "Don't get personal.",
    body: (
      <>
        Once feedback shifts to impressions of someone&apos;s character, it
        starts losing value. Talk about what happened and how it affected you.
        The more grounded in real experience your feedback is, the more{' '}
        <em>weight</em> it carries.
      </>
    )
  },
  {
    lead: "Write like you're talking to a friend.",
    body: "A review that sounds like a student talking to another student is much more useful than a polished, formal one. Remember you're talking to someone who wants to know what this course was like, not for a project report."
  },
  {
    lead: "If you're angry, wait.",
    body: 'A review written in frustration rarely gives other students the information they actually need. Step away, breathe in, then write.'
  }
]

const prohibitedItems = [
  {
    label: 'Insults or personal attacks',
    description:
      'anything targeting appearance, age, gender, race, religion, or disability'
  },
  {
    label: 'Profanity or vulgarity',
    description:
      'swearing, crude language, sexually explicit content. You know.'
  },
  {
    label: 'Personal contact information',
    description:
      "a professor's home address, personal email, phone number, etc."
  },
  {
    label: 'Copying another review',
    description: 'we check for near-exact matches'
  },
  {
    label: 'Fabricated or AI-generated content',
    description: "that doesn't reflect a real personal experience"
  }
]

export default function GuidelinesPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-18">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <div className="mb-14">
          <h1 className="mb-4 text-3xl font-semibold md:text-4xl">
            How to Write Great Feedback
          </h1>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Uni Feedback exists so students can help each other make better
              course choices. Every review you write might be the thing that
              helps other students decide to take or avoid a course. That's why
              the quality of what you write matters.
            </p>
            <p>
              All reviews are{' '}
              <span className="font-semibold text-foreground">anonymous</span>.
              Nobody will know who wrote what, so feel free to share your real
              experience without worrying about how it comes across.
            </p>
          </div>
        </div>

        {/* Our values */}
        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-semibold">Our values</h2>
          <div className="space-y-5 text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Be honest. </span>
              Your review has to reflect your actual experience. Share what you
              genuinely went through, not what you think sounds good, and not
              what you think others want to hear.
            </p>
            <p>
              <span className="font-semibold text-foreground">
                Be helpful.{' '}
              </span>
              Write as if you're advising a friend who is about to decide
              whether to take this course. What do they actually need to know?
            </p>
          </div>
        </section>

        {/* Writing great feedback */}
        <section className="mb-14">
          <h2 className="mb-2 text-2xl font-semibold">
            Writing great feedback
          </h2>
          <div className="divide-y">
            {writingItems.map((item) => (
              <div key={item.lead} className="py-5">
                <p className="mb-1 font-semibold">{item.lead}</p>
                <p className="text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-muted-foreground">
            It's fine to be critical. It's fine to give a 1-star rating. We will
            never remove a review just because it's negative.
          </p>
        </section>

        {/* Using AI */}
        <section className="mb-14">
          <div className="rounded-lg bg-muted p-6">
            <h2 className="mb-3 text-2xl font-semibold">
              Using AI to write your review
            </h2>
            <p className="text-muted-foreground">
              Using AI to help write your review is fine. I often use it myself
              to organize my thoughts or find the right words for something I
              want to say. That's totally valid, but keep in mind:
            </p>
            <div className="mt-5 space-y-4">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Your review has to reflect your experience.{' '}
                </span>
                If an AI invented details, exaggerated things, or filled in gaps
                you don&apos;t actually know about, that defeats the{' '}
                <em>purpose</em>. Other students are counting on real
                experiences.
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Don't over-polish it.{' '}
                </span>
                This is a platform for students talking to other students.
                There&apos;s no one to impress and no one who&apos;ll know
                it&apos;s you. A review that sounds overly formal or corporate
                loses the <em>warmth</em> that makes it actually useful. Use{' '}
                <em>your own</em> voice, just make sure your thoughts come
                through clearly.
              </p>
            </div>
          </div>
        </section>

        {/* What we don't allow */}
        <section className="mb-14">
          <h2 className="mb-3 text-2xl font-semibold">What we don't allow</h2>
          <p className="mb-4 text-muted-foreground">
            Most of this is common sense, and most people never need to read
            this list. But just so we&apos;re all on the same page:
          </p>
          <ul className="space-y-2">
            {prohibitedItems.map((item) => (
              <li key={item.label} className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {item.label}
                </span>
                {item.description && ` (${item.description})`}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-muted-foreground">
            If you see a review that violates these guidelines, use the flag
            button. Don't post a counter-review.
          </p>
        </section>

        {/* A few quick rules */}
        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-semibold">A few quick rules</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>You can only submit one feedback per course</li>
            <li>You should have taken or be currently taking the course</li>
            <li>
              We never edit your submission to make it comply. Either it stays
              as written, or it&apos;s removed
            </li>
            <li>
              If we do remove a review, we&apos;ll reach out to explain why and
              help you update it so it can go up again
            </li>
          </ul>
        </section>

        {/* Footer */}
        <div className="border-t pt-8 space-y-5">
          <p className="text-muted-foreground">
            Got questions or spotted something that shouldn't be here? Reach out
            at{' '}
            <a
              href="mailto:afonso@uni-feedback.com"
              className="font-medium text-foreground hover:underline"
            >
              afonso@uni-feedback.com
            </a>
          </p>
          <Button asChild>
            <Link to="/feedback/new">Give feedback</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            For the complete moderation policy, see the{' '}
            <Link
              to="/guidelines/full"
              className="underline hover:text-foreground"
            >
              full guidelines
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
