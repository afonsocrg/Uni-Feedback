import { PenSquare, Users } from 'lucide-react'
import { Link } from 'react-router'

import {
  GiveawayFAQSection,
  GiveawayHeroSection,
  HowToWinSection
} from '~/components/giveaway'

import type { Route } from './+types/giveaway'

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

      {/* How Points Work Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-8">
                How points work
              </h2>
              <p className="text-muted-foreground">
                Points decide your chances in the giveaway. The more points you
                earn, the more chances you get to win.
              </p>
            </div>

            <div className="grid gap-12 md:grid-cols-2">
              {/* Give Feedback */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-background">
                    <PenSquare className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">Give Feedback</h3>
                </div>
                <p className="text-muted-foreground">
                  Write helpful feedback for courses you took.
                  <br />
                  Better, more detailed feedback earns more points (up to 20
                  points per review).
                </p>
              </div>

              {/* Invite Friends */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-background">
                    <Users className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">Invite Friends</h3>
                </div>
                <p className="text-muted-foreground">
                  Share Uni Feedback with your friends.
                  <br />
                  You get +10 points for every friend who joins with your link.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/points"
                className="font-medium text-primary hover:underline"
              >
                Learn more about points
              </Link>
            </div>
          </div>
        </div>
      </section>

      <GiveawayFAQSection />
    </>
  )
}
