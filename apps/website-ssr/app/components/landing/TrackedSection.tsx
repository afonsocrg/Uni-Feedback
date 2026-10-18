import { useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '~/hooks'
import { analytics, type LandingSection } from '~/utils/analytics'

interface TrackedSectionProps {
  section: LandingSection
  /** Place in the page order, so a reorder shows in the data. */
  position: number
  children: ReactNode
}

/**
 * Fires `landing_section_viewed` once, when the section's top comes into view.
 *
 * A wrapper rather than a hook inside each section, so the sections stay
 * unaware of analytics and the page order lives in one place (`landing.tsx`).
 * "Into view" means the top has passed the bottom quarter of the viewport: a
 * sliver peeking under the fold is not a view, and a section taller than the
 * screen (the testimonials on a phone) would never be half visible.
 */
export function TrackedSection({
  section,
  position,
  children
}: TrackedSectionProps) {
  const { isAuthenticated } = useAuth()
  const ref = useRef<HTMLDivElement>(null)
  const viewed = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || viewed.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Zero height: the section rendered nothing (a switch is off, or an
        // empty feed), which is not a view.
        if (!entry.isIntersecting || viewed.current) return
        if (entry.boundingClientRect.height === 0) return
        viewed.current = true
        analytics.landing.sectionViewed({ section, position, isAuthenticated })
        observer.disconnect()
      },
      { rootMargin: '0px 0px -25% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [section, position, isAuthenticated])

  return <div ref={ref}>{children}</div>
}
