import { Button } from '@uni-feedback/ui'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { Feedback, StudentClub } from '@uni-feedback/db'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'
import { getAssetUrl } from '../../utils'
import { LandingFeedbackCard } from '../feedback/LandingFeedbackCard'

interface HeroSectionProps {
  studentClubs: StudentClub[]
  recentFeedbacks: Feedback[]
}

export function HeroSectionV4({
  studentClubs,
  recentFeedbacks
}: HeroSectionProps) {
  const lastVisitedPath = useLastVisitedPath()
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDesktop, setIsDesktop] = useState(true)

  // Both mobile and desktop show 1 now
  const itemsPerPage = {
    mobile: 1,
    desktop: 1
  }

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Calculate max index: both mobile and desktop go to the last item
  const maxIndex = recentFeedbacks.length - 1

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < maxIndex

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

        .feedback-carousel {
          transition: transform 0.3s ease-in-out;
        }

        @media (max-width: 767px) {
          .feedback-carousel {
            transform: translateX(calc(var(--mobile-index) * (-100% - 1.5rem)));
          }
        }

        @media (min-width: 768px) {
          .feedback-carousel {
            transform: translateX(calc(var(--desktop-index) * (-100% - 1.5rem)));
          }
        }
      `}</style>
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          {/* Two-column layout on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-16">
            {/* Left Column: Feedback Carousel */}
            <div className="w-full">
              <div className="flex items-center gap-4">
                {/* Left Navigation Arrow */}
                <button
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                  className="flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:opacity-70 transition-opacity"
                  aria-label="Previous feedback"
                >
                  <ChevronLeft className="size-8 text-gray-700" />
                </button>

                {/* Carousel Track */}
                <div className="overflow-hidden flex-1">
                  <div
                    className="feedback-carousel flex gap-6"
                    style={
                      {
                        '--mobile-index': currentIndex,
                        '--desktop-index': currentIndex
                      } as React.CSSProperties
                    }
                  >
                    {recentFeedbacks.map((feedback) => (
                      <div key={feedback.id} className="w-full flex-shrink-0">
                        <LandingFeedbackCard feedback={feedback} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Navigation Arrow */}
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:opacity-70 transition-opacity"
                  aria-label="Next feedback"
                >
                  <ChevronRight className="size-8 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Right Column: Header, Subtitle, CTA */}
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
                      className="h-6 md:h-8 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
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
                      className="h-8 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
