import { useEffect, useRef, useState } from 'react'
import { analytics, type DegreeSectionId } from '~/utils/analytics'

export interface TocSection {
  id: DegreeSectionId
  label: string
}

/** How far below the top of the viewport a section counts as "current". */
const SPY_OFFSET = 140

/**
 * The section the reader is in, and a one-off `degree_section_viewed` for each
 * section that comes into view. Starts at the first section so the server and
 * the first client render agree.
 */
export function useScrollSpy(
  sections: TocSection[],
  track: { facultySlug: string | null; degreeSlug: string | null }
): DegreeSectionId | null {
  const [current, setCurrent] = useState<DegreeSectionId | null>(
    sections[0]?.id ?? null
  )
  const viewed = useRef(new Set<DegreeSectionId>())
  const key = sections.map((s) => s.id).join(',')

  useEffect(() => {
    viewed.current = new Set()
    let frame = 0
    const update = () => {
      frame = 0
      let active = sections[0]?.id ?? null
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top < SPY_OFFSET) active = section.id
        if (
          rect.top < window.innerHeight * 0.75 &&
          rect.bottom > 0 &&
          !viewed.current.has(section.id)
        ) {
          viewed.current.add(section.id)
          if (track.facultySlug && track.degreeSlug) {
            analytics.discovery.degreeSectionViewed({
              facultySlug: track.facultySlug,
              degreeSlug: track.degreeSlug,
              section: section.id
            })
          }
        }
      }
      // At the very bottom the last short sections can never reach the
      // offset: the last one is the one being read.
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      ) {
        active = sections.at(-1)?.id ?? active
      }
      setCurrent(active)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
    // `key` stands for `sections`, which is rebuilt on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, track.facultySlug, track.degreeSlug])

  return current
}

/** Scrolls to a section and puts its id in the URL, without a history entry. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
}
