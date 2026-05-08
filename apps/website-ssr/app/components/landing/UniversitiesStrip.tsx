// Not currently used on the landing page.
// We tried placing it in the hero but it added too much height and felt repetitive
// next to the SupportersSection carousel. The BrowseSection already answers
// "what universities are covered?" when users start exploring.
// Good candidate to revisit if we expand to many more universities.
import { useEffect, useRef, useState } from 'react'
import { getAssetUrl } from '~/utils'

interface Faculty {
  id: number
  name: string
  logo: string | null
  logoHorizontal: string | null
}

interface UniversitiesStripProps {
  faculties: Faculty[]
}

export function UniversitiesStrip({ faculties }: UniversitiesStripProps) {
  const withLogos = faculties.filter((f) => f.logoHorizontal || f.logo)
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const naturalWidthRef = useRef<number | null>(null)
  const [shouldScroll, setShouldScroll] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track) return

    const check = () => {
      // Capture natural width before any duplication happens
      if (naturalWidthRef.current === null) {
        naturalWidthRef.current = track.scrollWidth
      }
      setShouldScroll(naturalWidthRef.current > container.clientWidth)
    }

    check()
    const observer = new ResizeObserver(check)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  if (withLogos.length === 0) return null

  const logos = withLogos.map((faculty) => {
    const logoPath = faculty.logoHorizontal || faculty.logo
    return (
      <img
        key={faculty.id}
        alt={`${faculty.name} logo`}
        src={getAssetUrl(logoPath!)}
        className="h-8 md:h-10 flex-shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all"
      />
    )
  })

  return (
    <>
      {shouldScroll && (
        <style>{`
          @keyframes uni-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .hero-uni-carousel:hover .animate-uni-scroll {
            animation-play-state: paused;
          }
          .animate-uni-scroll {
            animation: uni-scroll 30s linear infinite;
            display: flex;
            gap: 2.5rem;
            width: max-content;
            align-items: center;
          }
        `}</style>
      )}
      <div className="w-full text-center pb-8 px-4">
        <p className="text-xs text-muted-foreground mb-4">
          Currently supporting
        </p>
        <div
          ref={containerRef}
          className="relative overflow-hidden max-w-2xl mx-auto hero-uni-carousel"
        >
          <div
            ref={trackRef}
            className={
              shouldScroll
                ? 'animate-uni-scroll'
                : 'flex gap-10 justify-center items-center'
            }
          >
            {logos}
            {shouldScroll &&
              withLogos.map((faculty) => {
                const logoPath = faculty.logoHorizontal || faculty.logo
                return (
                  <img
                    key={`dup-${faculty.id}`}
                    alt={`${faculty.name} logo`}
                    src={getAssetUrl(logoPath!)}
                    className="h-8 md:h-10 flex-shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all"
                  />
                )
              })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-3">
          Don't see yours?{' '}
          <a
            href="mailto:afonso@uni-feedback.com"
            className="underline hover:text-muted-foreground transition-colors"
          >
            Reach out
          </a>
        </p>
      </div>
    </>
  )
}
