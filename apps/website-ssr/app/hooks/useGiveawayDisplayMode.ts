import { useSyncExternalStore } from 'react'

/**
 * How the giveaway deadline is shown:
 * - `auto`: show the end date when far out, switch to the live countdown once
 *   the deadline is near (see `GIVEAWAY_COUNTDOWN_THRESHOLD_DAYS`). This is the
 *   production behaviour.
 * - `date` / `countdown`: force one display, used by the dev panel to preview
 *   both versions before deploying.
 */
export type GiveawayDisplayMode = 'auto' | 'date' | 'countdown'

const STORAGE_KEY = 'uni-feedback-giveaway-display-mode'

// Module-level store so every <GiveawayCountdown> instance (hero, CTA, promo
// band, banner) reacts to the dev toggle at once.
let mode: GiveawayDisplayMode = 'auto'
let hydrated = false
const listeners = new Set<() => void>()

function isMode(value: unknown): value is GiveawayDisplayMode {
  return value === 'auto' || value === 'date' || value === 'countdown'
}

function subscribe(callback: () => void) {
  // Lazily hydrate from localStorage on the first client subscription so the
  // initial render still matches the server ('auto') and avoids a mismatch.
  if (!hydrated) {
    hydrated = true
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isMode(stored) && stored !== mode) {
      mode = stored
      // Notify any instance that subscribed before this one hydrated.
      queueMicrotask(() => listeners.forEach((cb) => cb()))
    }
  }
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function setGiveawayDisplayMode(next: GiveawayDisplayMode) {
  mode = next
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next)
  }
  listeners.forEach((cb) => cb())
}

export function useGiveawayDisplayMode(): GiveawayDisplayMode {
  return useSyncExternalStore(
    subscribe,
    () => mode,
    () => 'auto'
  )
}
