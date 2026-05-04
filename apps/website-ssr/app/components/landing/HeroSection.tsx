import type { FeedbackFull, StudentClub } from '@uni-feedback/db'
import { getAssetUrl } from '~/utils'
import { HeroSearchBar } from './HeroSearchBar'

interface Stats {
  totalFeedback: number
  contributors: number
  coursesWithFeedback: number
}

interface HeroSectionProps {
  studentClubs: StudentClub[]
  recentFeedbacks: (FeedbackFull & {
    course: {
      name: string
      degree: { faculty: { shortName: string } } | null
    }
  })[]
  stats: Stats
}

export function HeroSection({
  studentClubs,
  recentFeedbacks,
  stats
}: HeroSectionProps) {
  const backgroundCards = [
    ...recentFeedbacks,
    ...recentFeedbacks,
    ...recentFeedbacks
  ]

  return (
    <>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
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

      {/*
        pt-20 on the section accounts for the fixed header (h-20 = 5rem).
        min-h-screen makes the section fill the full viewport.
        flex-col: upper zone (flex-1) + partners strip at bottom.
      */}
      <section
        className="relative flex flex-col"
        style={{ minHeight: 'calc(100vh - var(--header-height))' }}
      >
        {/* ── Upper zone: card background + hero content ─────────────── */}
        {/*
          No overflow-hidden here — that would clip the search dropdown.
          The card background has its own overflow-hidden container.
          z-10 on the hero content ensures the dropdown (z-50) renders above
          the partners strip which follows in the DOM.
        */}
        <div className="relative flex-1 flex items-center justify-center py-10 px-4">
          {/* Card background — scoped overflow-hidden so it won't clip the dropdown */}
          <div
            className="absolute inset-0 pointer-events-none select-none overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.14) 70%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.14) 70%)'
            }}
            aria-hidden="true"
          >
            <div
              className="columns-3 sm:columns-4 lg:columns-5 xl:columns-6 gap-2 p-3"
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
            >
              {backgroundCards.map((fb, i) => (
                <div
                  key={`${fb.id}-${i}`}
                  className="break-inside-avoid mb-2 bg-white rounded-lg p-3 shadow-sm text-xs space-y-1"
                >
                  <p className="font-semibold truncate text-gray-800">
                    {fb.course.name}
                  </p>
                  <p className="text-yellow-400 leading-none">
                    {'★'.repeat(fb.rating)}
                    <span className="text-gray-200">
                      {'★'.repeat(5 - fb.rating)}
                    </span>
                  </p>
                  {fb.comment && (
                    <p className="line-clamp-3 text-gray-500 leading-relaxed">
                      {fb.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hero text + search — z-10 so dropdown floats above the partners strip */}
          <div className="relative z-10 text-center max-w-3xl w-full">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4">
              Know what you're getting into.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-6">
              Workload, professors, the tips students share with each other...
              Anonymous feedback from students who took them.
            </p>

            <HeroSearchBar />

            <p className="text-xs text-muted-foreground/60 mt-2">
              {stats.totalFeedback.toLocaleString()}+ reviews ·{' '}
              {stats.contributors}+ contributors · {stats.coursesWithFeedback}+
              courses covered
            </p>
          </div>
        </div>

        {/* ── Partners: sits at the bottom of the viewport ────────────── */}
        <div className="w-full text-center pt-8 pb-12 px-4">
          <p className="text-xs text-muted-foreground mb-4">Supported by</p>
          <div className="relative overflow-hidden w-full carousel-container">
            <div className="animate-scroll">
              {studentClubs.map((club) => {
                const logoUrl = getAssetUrl(club.logoHorizontal)
                if (!club.logoHorizontal || !logoUrl) return null
                return (
                  <img
                    key={club.id}
                    alt={`${club.name} logo`}
                    src={logoUrl}
                    className="h-6 md:h-8 flex-shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all"
                  />
                )
              })}
              {studentClubs.map((club) => {
                const logoUrl = getAssetUrl(club.logoHorizontal)
                if (!club.logoHorizontal || !logoUrl) return null
                return (
                  <img
                    key={`dup-${club.id}`}
                    alt={`${club.name} logo`}
                    src={logoUrl}
                    className="h-6 md:h-8 flex-shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all"
                  />
                )
              })}
            </div>
          </div>
          <a
            href="/partners"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-block mt-2"
          >
            See all
          </a>
        </div>
      </section>
    </>
  )
}
