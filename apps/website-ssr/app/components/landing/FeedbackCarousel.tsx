import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { Feedback } from '@uni-feedback/db'
import { LandingFeedbackCard } from '../feedback/LandingFeedbackCard'

interface FeedbackCarouselProps {
  feedbacks: Feedback[]
  browseLink: string
}

export function FeedbackCarousel({
  feedbacks,
  browseLink
}: FeedbackCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Add 1 to account for the placeholder card
  const totalItems = feedbacks.length + 1
  const maxIndex = totalItems - 1

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
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="w-full flex-shrink-0">
                  <LandingFeedbackCard feedback={feedback} />
                </div>
              ))}
              {/* Placeholder card with CTA */}
              <div className="w-full flex-shrink-0">
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-6 h-full flex flex-col items-center justify-center text-center gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">
                      Want to see more?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Browse hundreds of feedbacks from students like you
                    </p>
                  </div>
                  <a
                    href={browseLink}
                    className="text-primary hover:underline font-medium flex items-center gap-2"
                  >
                    More Feedback
                    <ArrowRight className="size-4" />
                  </a>
                </div>
              </div>
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

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalItems }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to feedback ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      </div>
    </>
  )
}
