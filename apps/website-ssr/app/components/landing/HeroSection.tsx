import { Button } from '@uni-feedback/ui'
import { ArrowRight } from 'lucide-react'

import type { Feedback, StudentClub } from '@uni-feedback/db'
import { LandingFeedbackCard } from '../feedback/LandingFeedbackCard'
import { getAssetUrl } from '../../utils'

interface HeroSectionProps {
  studentClubs: StudentClub[]
  recentFeedbacks: Feedback[]
}

export function HeroSection({
  studentClubs,
  recentFeedbacks
}: HeroSectionProps) {
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
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-2">
            Honest, anonymous student feedback
            <br />
            to help you{' '}
            <span className="text-primary">find the right courses</span>
          </h1>
          <div className="">
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
                      className="h-8 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
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
          <div className="container mx-auto px-4 mt-12">
            <div className="max-w-5xl mx-auto">
              {/* Section heading */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Recent Course Reviews
                </h2>
                <p className="text-sm text-gray-600">
                  Real feedback submitted by students like you
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentFeedbacks.map((feedback) => (
                  <LandingFeedbackCard key={feedback.id} feedback={feedback} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Button size="lg" variant="outline">
                  View More Feedback
                  <ArrowRight className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
