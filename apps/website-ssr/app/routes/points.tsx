import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  PenSquare,
  Users
} from 'lucide-react'
import { Link } from 'react-router'

export function meta() {
  return [
    { title: 'How Points Work | Uni Feedback' },
    {
      name: 'description',
      content:
        'Learn how to earn Uni Feedback Points by sharing course reviews and inviting friends.'
    }
  ]
}

const FEEDBACK_CATEGORIES = [
  {
    icon: GraduationCap,
    title: 'Teaching',
    description:
      'How the professor teaches. Were classes engaging? Easy to follow? Were they available outside class?'
  },
  {
    icon: ClipboardCheck,
    title: 'Assessment',
    description:
      'Exams, projects, grading. Was it fair? Clear? How hard was it really?'
  },
  {
    icon: BookOpen,
    title: 'Materials',
    description:
      'Slides, readings, platforms. Did they actually help you study or were they useless?'
  },
  {
    icon: Lightbulb,
    title: 'Tips',
    description:
      'The stuff no one tells you. Study hacks, mistakes to avoid, or what you wish you knew before enrolling.'
  }
]

export default function PointsPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-18">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="mb-4 text-3xl font-semibold md:text-4xl">
            Uni Feedback Points
          </h1>
          <p className="text-muted-foreground">
            <span className="text-lg font-semibold">
              Points reflect how much you're helping other students.
            </span>
            <br />
            By sharing your feedback and letting other people know about Uni
            Feedback, you help build a better academic environment for everyone!
          </p>
        </div>

        {/* How You Earn Points */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-semibold">How to earn points</h2>

          <div className="grid gap-12 md:grid-cols-2">
            {/* Give Feedback */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <PenSquare className="size-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Give Feedback</h3>
              </div>
              <p className="text-muted-foreground">
                If your feedback follows our{' '}
                <Link
                  to="/guidelines"
                  className="font-medium underline hover:text-foreground"
                >
                  guidelines
                </Link>
                , you'll earn points based on how helpful it is:
              </p>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground mb-3">
                <li>
                  <strong>+1 point</strong> base for submitting feedback;
                </li>
                <li>
                  <strong>+4 points</strong> for each feedback category you mention (
                  <a
                    href="#feedback-categories"
                    className="font-medium underline hover:text-foreground"
                  >
                    see below
                  </a>
                  );
                </li>
                <li>
                  <strong>+3 bonus points</strong> if you cover all 4
                  categories.
                </li>
              </ul>
              <p className="text-muted-foreground">
                Ready to share your experience?{' '}
                <Link
                  to="/feedback/new"
                  className="font-medium text-primary hover:underline"
                >
                  Give feedback
                </Link>
              </p>
            </div>

            {/* Invite Friends */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Invite Friends</h3>
              </div>
              <p className="text-muted-foreground">
                Bring your classmates to Uni Feedback!
                <br />
                You get points once they sign up and post their first feedback:
              </p>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground mb-3">
                <li>
                  <strong>+10 points</strong> for each of your first 5 friends
                </li>
                <li>
                  <strong>+5 points</strong> for the next 10
                </li>
                <li>
                  <strong>+1 point</strong> for each friend after that
                </li>
              </ul>
              <p className="text-muted-foreground">
                You can invite friends from your{' '}
                <Link
                  to="/profile"
                  className="font-medium text-primary hover:underline"
                >
                  profile page
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              You can check your current points on your{' '}
              <Link
                to="/profile"
                className="font-medium text-primary hover:underline"
              >
                profile page
              </Link>
            </p>
          </div>
        </section>

        {/* Feedback Categories */}
        <section id="feedback-categories" className="mb-16">
          <h2 className="mb-2 text-2xl font-semibold">Feedback categories</h2>
          <p className="mb-8 text-muted-foreground">
            We look for these four things because they're what students actually
            care about.
            <br />
            Mention them <em>naturally</em> in your feedback to unlock bonus
            points. Cover all four to get an extra 3-point bonus!
          </p>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {FEEDBACK_CATEGORIES.map((category) => (
              <div key={category.title} className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <category.icon className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <div className="border-t pt-8">
          <p className="text-muted-foreground text-sm">
            Got questions or something not clear? Email us at{' '}
            <a
              href="mailto:help@uni-feedback.com"
              className="font-medium text-primary hover:underline"
            >
              help@uni-feedback.com
            </a>
            , and we'll get back to you!
          </p>
        </div>
      </div>
    </div>
  )
}
