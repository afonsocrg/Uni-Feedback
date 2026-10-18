import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LandingFeedbackCard } from '~/components/feedback/cards/LandingFeedbackCard'
import { analytics } from '~/utils/analytics'

interface FeedbackWithCourse {
  id: number
  courseId: number
  rating: number
  workloadRating: number | null
  comment: string | null
  createdAt: Date | null
  course: {
    name: string
    degree: { faculty: { shortName: string } } | null
  }
}

interface LiveFeedSectionProps {
  feedbacks: FeedbackWithCourse[]
}

export function LiveFeedSection({ feedbacks }: LiveFeedSectionProps) {
  const { t } = useTranslation('landing')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  // Whether anyone browses past the first cards. Autocapture only sees the
  // desktop arrows (4 people in 30 days, 2026-10-18); a phone swipe leaves no
  // trace, so the first horizontal scroll of each page view is tracked here.
  const scrollTracked = useRef(false)
  const lastArrowAt = useRef(0)
  const updateBounds = () => {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 0)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
    if (el.scrollLeft > 0 && !scrollTracked.current) {
      scrollTracked.current = true
      analytics.landing.feedScrolled({
        // An arrow's smooth scroll lands here within a second of the click;
        // anything else is a swipe, a trackpad or a shift-wheel.
        method: Date.now() - lastArrowAt.current < 1000 ? 'arrow' : 'swipe'
      })
    }
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
    lastArrowAt.current = Date.now()
    scrollRef.current?.scrollBy({
      left: dir === 'right' ? 320 : -320,
      behavior: 'smooth'
    })
  }

  return (
    <section className="pb-8">
      <style>{`
        .live-feed-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="hidden md:flex justify-between items-center gap-2 mb-4">
            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              {t('recent_feed.title')}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => scroll('left')}
                disabled={atStart}
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-default"
                aria-label={t('recent_feed.scroll_left')}
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={atEnd}
                className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-default"
                aria-label={t('recent_feed.scroll_right')}
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
                      {feedbacks.slice(i * 2, i * 2 + 2).map((fb, j) => (
                        <LandingFeedbackCard
                          key={fb.id}
                          feedback={fb}
                          onClick={() =>
                            analytics.landing.feedCardClicked({
                              feedbackId: fb.id,
                              courseId: fb.courseId,
                              position: i * 2 + j
                            })
                          }
                        />
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
