import { getSchoolYear, SCHOOL_YEAR_START_MONTH } from './schoolYear'

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

/**
 * Whether the winners have been published.
 *
 * A manual switch and NOT a date, on purpose: the draw happens by hand once the
 * window closes, and the names ship in the same deploy that flips this. A date
 * here would promise an announcement the site cannot make on its own.
 *
 * TO ANNOUNCE THE WINNERS: set this to `true` and fill in the winner block (see
 * `GiveawayResultsWinner`). Until then every page says the winners are being
 * drawn and points at the 1–2 August promise.
 */
export const GIVEAWAY_WINNERS_ANNOUNCED = false

/**
 * Where the edition is in its lifecycle. This exists so the copy that has to
 * change at midnight changes without a deploy: the window closes on a clock, and
 * whoever is running the draw should not also be shipping code.
 *
 *   `active`    the ask is live: earn points, countdown running.
 *   `drawing`   window closed, winners not published yet.
 *   `announced` winners are up.
 *
 * Anything before `GIVEAWAY_START` reads as `active` on purpose. The campaign
 * page before the start is the same ask with a further-away deadline, which is
 * exactly what it showed in the days before 29 June, so a fourth phase would
 * only add a branch no page renders differently.
 *
 * Deliberately NOT the same question as `isGiveawayActive()`, which is strictly
 * "is now inside the window" and gates real eligibility (points, referrals,
 * share copy). Use that one for anything that grants something; use this one for
 * what a page says.
 */
export const GIVEAWAY_PHASES = ['active', 'drawing', 'announced'] as const

export type GiveawayPhase = (typeof GIVEAWAY_PHASES)[number]

export function getGiveawayPhase(now: Date = new Date()): GiveawayPhase {
  if (now < GIVEAWAY_END) return 'active'
  return GIVEAWAY_WINNERS_ANNOUNCED ? 'announced' : 'drawing'
}

/**
 * School year (as stored in the DB) whose feedback counts toward the giveaway.
 * Only feedback for courses taken in this year earns giveaway entries; feedback
 * for older courses still earns permanent profile points.
 *
 * Derived from the date rather than pinned to a literal so each edition scopes
 * itself: a giveaway run in July 2026 counts 2025/2026 feedback, and the same
 * rules in July 2027 count 2026/2027 feedback with no code change. Editions run
 * before September, so the school year has not rolled over yet when they close.
 */
export function getGiveawaySchoolYear(now: Date = new Date()): number {
  return getSchoolYear(now, SCHOOL_YEAR_START_MONTH)
}
