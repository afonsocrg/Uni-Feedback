import { Button } from '@uni-feedback/ui'
import { ArrowRight } from 'lucide-react'

import type { Feedback, StudentClub } from '@uni-feedback/db'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'
import { getAssetUrl } from '~/utils'
import { FeedbackCarousel } from './FeedbackCarousel'

interface HeroSectionProps {
  studentClubs: StudentClub[]
  recentFeedbacks: Feedback[]
}

export function HeroSection({
  studentClubs,
  recentFeedbacks
}: HeroSectionProps) {
  const lastVisitedPath = useLastVisitedPath()
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'

  return (
    <>
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .carousel-container:hover .animate-scroll {
          animation-play-state: paused;
        }

        .animate-scroll {
          animation: scroll 40s linear infinite;
          display: flex;
          gap: 2rem;
          width: max-content;
        }
      `}</style>
      <section className="min-h-screen container mx-auto px-4 pt-20 md:pt-22 pb-16 md:pb-24 flex items-center">
        <div className="max-w-7xl mx-auto w-full -mt-12 md:-mt-16">
          {/* Two-column layout on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-16">
            {/* Left Column: Header, Subtitle, CTA */}
            <div className="text-center md:text-left space-y-6">
              <div className="space-y-4">
                <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                  Honest, anonymous student feedback
                  <br />
                  to help you{' '}
                  <span className="text-primary">find the right courses</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Stop guessing. Know what you&apos;re getting into before
                  choosing a course
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" asChild>
                  <a href={browseLink}>
                    Browse Courses
                    <ArrowRight className="size-5" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Right Column: Feedback Carousel */}
            <FeedbackCarousel
              feedbacks={recentFeedbacks}
              browseLink={browseLink}
            />
          </div>

          {/* Student Club Logos - Full Width at Bottom */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-4">Powered by</p>
            <div className="relative overflow-hidden w-full carousel-container">
              <div className="animate-scroll">
                {/* First set of logos */}
                {studentClubs.map((club) => {
                  const logoUrl = getAssetUrl(club.logoHorizontal)
                  if (!logoUrl) return null

                  return (
                    <img
                      key={club.id}
                      alt={`${club.name} logo`}
                      src={logoUrl}
                      className="h-6 md:h-8 flex-shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all"
                    />
                  )
                })}
                {/* Duplicate set for seamless loop */}
                {studentClubs.map((club) => {
                  const logoUrl = getAssetUrl(club.logoHorizontal)
                  if (!logoUrl) return null

                  return (
                    <img
                      key={`duplicate-${club.id}`}
                      alt={`${club.name} logo`}
                      src={logoUrl}
                      className="h-8 flex-shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all"
                    />
                  )
                })}
              </div>
            </div>
            <a
              href="/partners"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-block mt-2"
            >
              View all partners
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
