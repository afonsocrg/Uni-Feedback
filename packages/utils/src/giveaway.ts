/**
 * Giveaway campaign window. This is the single source of truth shared by the
 * API (referral/prize eligibility) and the website (whether to surface the
 * giveaway hook in share copy). Kept here so the dates never drift between apps.
 *
 * Authoritative window: June 29 → end of July 2026, Lisbon time. END is
 * exclusive.
 */
export const GIVEAWAY_START = new Date('2026-06-29T00:00:00+01:00')
export const GIVEAWAY_END = new Date('2026-08-01T00:00:00+01:00')

/** Whether the giveaway is live at `now` (defaults to the current time). */
export function isGiveawayActive(now: Date = new Date()): boolean {
  return now >= GIVEAWAY_START && now < GIVEAWAY_END
}
