import type { FeedbackFull } from '@uni-feedback/db'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LandingFeedbackCard } from '~/components/feedback/cards/LandingFeedbackCard'

interface LiveFeedSectionProps {
  feedbacks: (FeedbackFull & {
    course: {
      name: string
      degree: { faculty: { shortName: string } } | null
    }
  })[]
}

export function LiveFeedSection({ feedbacks }: LiveFeedSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const updateBounds = () => {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 0)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateBounds()
    el.addEventListener('scroll', updateBounds, { passive: true })
    return () => el.removeEventListener('scroll', updateBounds)
  }, [])

  if (feedbacks.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: dir === 'right' ? 320 : -320,
      behavior: 'smooth'
    })
  }

  return (
    <section className="py-16 md:py-24">
      <style>{`
        .live-feed-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight">
              What students are saying
            </h2>
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={atStart}
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-default"
                aria-label="Scroll left"
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={atEnd}
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-default"
                aria-label="Scroll right"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
          </div>

          <div
            className="relative"
            style={(() => {
              const left = atStart ? 'black 0' : 'transparent 0, black 3rem'
              const right = atEnd
                ? 'black 100%'
                : 'black calc(100% - 3rem), transparent 100%'
              const mask = `linear-gradient(to right, ${left}, ${right})`
              return { maskImage: mask, WebkitMaskImage: mask }
            })()}
          >
            <div
              ref={scrollRef}
              className="live-feed-scroll overflow-x-scroll"
              style={{ scrollbarWidth: 'none' }}
            >
              <div className="flex gap-4 pb-1 pl-1 pr-4 items-start">
                {Array.from(
                  { length: Math.ceil(feedbacks.length / 2) },
                  (_, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-4 w-72 flex-shrink-0"
                    >
                      {feedbacks.slice(i * 2, i * 2 + 2).map((fb) => (
                        <LandingFeedbackCard key={fb.id} feedback={fb} />
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* <div className="text-center mt-8">
          <a
            href="/browse"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse all reviews →
          </a>
        </div> */}
        </div>
      </div>
    </section>
  )
}
