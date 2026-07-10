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
