import type { RefObject } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * `useLayoutEffect` warns when it runs during SSR, and this hook is used on a
 * server-rendered page. The layout variant is what makes the reset-to-zero
 * invisible (see below), so it is worth keeping on the client.
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** Fast out of the gate, long settle. Reads as the number arriving, not ticking. */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

interface UseCountUpOptions {
  durationMs?: number
}

interface UseCountUp<T> {
  /** Attach to the element whose entering the viewport starts the animation. */
  ref: RefObject<T | null>
  /** 0 to 1. Multiply each target value by this and round. */
  progress: number
}

/**
 * One eased 0-to-1 ramp, shared by every number in a group.
 *
 * Deliberately a single progress value rather than a hook per number: with
 * independent timers six counters finish at six different moments and the strip
 * reads as a slot machine. Sharing the ramp means they climb at different rates
 * (each is a fraction of its own target) but land on the same frame, which
 * reads as one reveal.
 *
 * Two things this must not break:
 *   - SSR. `progress` starts at 1, so the server renders the real numbers and
 *     they are in the HTML for crawlers and for anyone with JS off. The layout
 *     effect resets it to 0 before the browser paints, so nobody sees the final
 *     value flash first.
 *   - `prefers-reduced-motion`. Bail before the reset and the numbers simply
 *     render, already final.
 */
export function useCountUp<T extends HTMLElement = HTMLElement>({
  durationMs = 1100
}: UseCountUpOptions = {}): UseCountUp<T> {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(1)

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setProgress(0)

    let frame = 0
    let startedAt: number | null = null

    const step = (now: number) => {
      startedAt ??= now
      const t = Math.min((now - startedAt) / durationMs, 1)
      setProgress(easeOutCubic(t))
      if (t < 1) frame = requestAnimationFrame(step)
    }

    // Threshold rather than 0: on this page the strip sits just below the fold
    // on mobile, and starting the count while only its top hairline is visible
    // wastes the whole animation above the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        frame = requestAnimationFrame(step)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [durationMs])

  return { ref, progress }
}
