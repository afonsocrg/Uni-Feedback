import { useEffect, useState } from 'react'

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  /** Milliseconds left until the target. Clamped to 0 once it passes. */
  total: number
  isExpired: boolean
}

function computeRemaining(targetMs: number): TimeRemaining {
  const total = Math.max(0, targetMs - Date.now())
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
    isExpired: total <= 0
  }
}

/**
 * Live countdown to `target`. Returns `null` on the server and on the first
 * client render so the SSR markup matches hydration; the real value fills in
 * after mount and then ticks every second.
 */
export function useCountdown(target: Date): TimeRemaining | null {
  const [remaining, setRemaining] = useState<TimeRemaining | null>(null)

  useEffect(() => {
    const targetMs = target.getTime()
    const tick = () => setRemaining(computeRemaining(targetMs))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  return remaining
}
