import {
  Markdown,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@uni-feedback/ui'
import { Link } from 'react-router'
import { markdown } from '../../../../legal/giveaway_rules.md'

export function meta() {
  return [
    { title: 'Giveaway Rules | Uni Feedback' },
    {
      name: 'description',
      content:
        'Official rules for the Uni Feedback Giveaway. Learn about eligibility, how to enter, and prize details.'
    }
  ]
}

function StructuredVersion() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="mb-4 text-3xl font-semibold md:text-4xl">
          Official Uni Feedback Giveaway Rules
        </h1>
        <p className="text-muted-foreground">
          This page sets out the official rules for the Uni Feedback Giveaway.
          <br />
          By taking part, you agree to the rules below.
        </p>
      </div>

      {/* 1. Eligibility */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">1. Eligibility</h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-1 text-lg font-semibold">University status</h3>
            <p className="text-muted-foreground">
              You must be a student at IST, SBE, FCT, or IMS and have a valid
              university email address.
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-lg font-semibold">Account verification</h3>
            <p className="text-muted-foreground">
              You must log in to Uni Feedback using your university email
              address.
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-lg font-semibold">
              One account per student
            </h3>
            <p className="text-muted-foreground">
              Only one account per student is allowed. Multiple accounts, shared
              accounts, or variations of the same email address will result in
              disqualification.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Giveaway Period */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">2. Giveaway Period</h2>

        <div className="space-y-4 text-muted-foreground">
          <p>
            The giveaway runs until{' '}
            <strong className="text-foreground">
              February 27 2026, 23:59:59 (Lisbon time)
            </strong>
            .
          </p>
          <p>
            Only points earned until this time will count toward the draw,
            unless stated otherwise below.
          </p>
          <p>
            The winner will be selected and contacted by{' '}
            <strong className="text-foreground">March 2nd</strong>.
          </p>
        </div>
      </section>

      {/* 3. How to Enter */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">3. How to Enter</h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Approved feedback</h3>
            <p className="mb-3 text-muted-foreground">
              To enter, you must submit at least one feedback for a course taken
              during the 2025/2026 academic year.
            </p>
            <p className="mb-2 text-muted-foreground">All feedback must:</p>
            <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
              <li>Be submitted during the giveaway period</li>
              <li>
                Comply with our{' '}
                <Link
                  to="/guidelines"
                  className="font-medium text-primary hover:underline"
                >
                  Feedback Guidelines
                </Link>
              </li>
              <li>Be approved by Uni Feedback before the draw</li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Feedbacks that are not approved earn 0 entries.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Existing users</h3>
            <p className="text-muted-foreground">
              If you submitted feedback before the giveaway period, those points
              remain valid where applicable. To activate your points for this
              giveaway, you must log in to the platform before the giveaway
              deadline (points will be awarded automatically).
            </p>
          </div>
        </div>
      </section>

      {/* 4. Points, Entries & Winner Selection */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          4. Points, Entries & Winner Selection
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Weighted draw</h3>
            <p className="text-muted-foreground">
              The winner is selected through a random weighted draw.
            </p>
            <p className="mt-2 font-medium">1 point = 1 entry in the draw</p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Points calculation</h3>
            <p className="text-muted-foreground">
              How points are earned for feedback and referrals is explained on
              the{' '}
              <Link
                to="/points"
                className="font-medium text-primary hover:underline"
              >
                Point System Page
              </Link>
              .
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              Giveaway-specific limits
            </h3>
            <p className="mb-2 text-muted-foreground">
              For this giveaway, we will only consider points earned from:
            </p>
            <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
              <li>Referrals, and/or</li>
              <li>
                Feedback for courses taken during the 2025/2026 academic year
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Winner Announcement & Prize */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          5. Winner Announcement & Prize
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold">The prize</h3>
            <p className="text-muted-foreground">
              One (1) NOS Alive Festival – 1-Day Pass for the July 10th 2026.
            </p>
            <p className="mt-1 text-muted-foreground">
              The prize is awarded as is and has no cash alternative.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Notification</h3>
            <p className="text-muted-foreground">
              The winner will be notified via their university email address.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Public announcement</h3>
            <p className="mb-2 text-muted-foreground">
              For transparency, the winner will be publicly announced as:
            </p>
            <p className="text-muted-foreground">
              [First Name] [Last Initial] from [University] (e.g. João M. from
              IST).
            </p>
            <p className="mt-2 text-muted-foreground">
              All course feedback remains fully anonymous.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Claim deadline</h3>
            <p className="text-muted-foreground">
              The winner must reply to the notification email within 7 days. If
              the prize is not claimed, a backup winner will be selected.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Anti-Fraud & Disqualification */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          6. Anti-Fraud & Disqualification
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Content integrity</h3>
            <p className="text-muted-foreground">
              Plagiarized, AI-generated, low-effort, or spam feedback are not
              allowed and will receive 0 points.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Referral abuse</h3>
            <p className="text-muted-foreground">
              Self-referrals or any attempt to manipulate the referral system
              will result in immediate disqualification.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Right to review</h3>
            <p className="text-muted-foreground">
              Uni Feedback reserves the right to review, audit, and disqualify
              accounts at any point before or after the draw if abuse or rule
              violations are detected.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Final Notes */}
      <section className="mb-8">
        <h2 className="mb-6 text-2xl font-semibold">7. Final Notes</h2>

        <div className="space-y-4 text-muted-foreground">
          <p>
            For information about how your data is handled, please see our{' '}
            <Link
              to="/privacy"
              className="font-medium text-primary hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            All decisions related to feedback approval, point allocation,
            disqualification, and winner selection are final.
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <div className="border-t pt-8">
        <p className="text-sm text-muted-foreground">
          Got questions about the giveaway rules? Email us at{' '}
          <a
            href="mailto:help@uni-feedback.com"
            className="font-medium text-primary hover:underline"
          >
            help@uni-feedback.com
          </a>
        </p>
      </div>
    </div>
  )
}

function MarkdownVersion() {
  return (
    <div className="mx-auto max-w-2xl">
      <Markdown
        className="prose-lg text-muted-foreground"
        components={{
          h1: ({ ...props }) => (
            <h1
              {...props}
              className="text-3xl font-semibold text-gray-900 mb-4"
            />
          ),
          h2: ({ ...props }) => (
            <h2
              {...props}
              className="text-2xl font-semibold text-gray-900 mt-10 mb-4"
            />
          ),
          h3: ({ ...props }) => (
            <h3
              {...props}
              className="text-lg font-semibold text-gray-900 mt-5 mb-1"
            />
          ),
          ul: ({ ...props }) => (
            <ul
              {...props}
              className="ml-6 list-disc space-y-1 text-muted-foreground"
            />
          ),
          p: ({ ...props }) => <p {...props} className="mt-2" />,
          hr: () => <hr className="my-8 border-t border-gray-200" />,
          strong: ({ ...props }) => (
            <strong {...props} className="text-foreground font-semibold" />
          )
        }}
      >
        {markdown}
      </Markdown>
    </div>
  )
}

export default function GiveawayRulesPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-18">
      <MarkdownVersion />
    </div>
  )
  return (
    <div className="container mx-auto px-4 py-16 md:py-18">
      <Tabs defaultValue="structured" className="mx-auto max-w-3xl">
        <div className="mb-8 flex justify-center">
          <TabsList>
            <TabsTrigger value="structured">Structured HTML</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="structured">
          <StructuredVersion />
        </TabsContent>

        <TabsContent value="markdown">
          <MarkdownVersion />
        </TabsContent>
      </Tabs>
    </div>
  )
}
