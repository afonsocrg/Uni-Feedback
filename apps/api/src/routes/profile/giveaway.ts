import { requireAuth } from '@middleware'
import {
  PERFECT_FEEDBACK_BONUS_POINTS,
  PERFECT_FEEDBACK_BONUS_SCHOOL_YEAR,
  PERFECT_FEEDBACK_THRESHOLD,
  PointService,
  REFERRAL_POINTS
} from '@services/pointService'
import { database } from '@uni-feedback/db'
import { feedback, pointRegistry, users } from '@uni-feedback/db/schema'
import { GIVEAWAY_END, GIVEAWAY_START } from '@uni-feedback/utils'
import { OpenAPIRoute } from 'chanfana'
import { and, count, eq, gte, inArray, lt, notExists, sum } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

/**
 * School year (as stored in the DB) whose feedback counts toward the giveaway.
 * 2025 == 2025/2026.
 */
const GIVEAWAY_SCHOOL_YEAR = 2025

/**
 * Referral counting window for the giveaway (Ambassador prize + referral
 * entries). This equals the giveaway campaign window, so it reuses the shared
 * dates from @uni-feedback/utils rather than redefining them. END is exclusive.
 */
const REFERRAL_WINDOW_START = GIVEAWAY_START
const REFERRAL_WINDOW_END = GIVEAWAY_END

/**
 * Percentile bands for the raffle standing, best-first. `fraction` is the
 * share of participants at or above the band (e.g. 0.10 == top 10%).
 */
const RAFFLE_BANDS = [
  { band: 'top1', fraction: 0.01 },
  { band: 'top5', fraction: 0.05 },
  { band: 'top10', fraction: 0.1 },
  { band: 'top25', fraction: 0.25 },
  { band: 'top50', fraction: 0.5 }
] as const

type RaffleBand = (typeof RAFFLE_BANDS)[number]['band']

/**
 * Minimum number of participants (entries > 0) before we show percentile
 * bands. Below this a percentile is noise ("top 1% of 3 people"), so we hide
 * it and let the boost CTAs carry the section.
 */
const MIN_PARTICIPANTS_FOR_BANDS = 10

/**
 * Largest "referrals needed to reach 1st place" we're willing to surface. If a
 * user needs more than this many referrals to take sole first place, the
 * payload drops all competitive data (state 'far') so a far-behind student is
 * never shown a demoralizing target. This directly caps the number rendered in
 * the UI — raise it to reveal the race to students who are further back.
 */
const AMBASSADOR_MAX_REFERRALS_TO_WIN = 3

/**
 * Smallest entry count needed to sit within the top `fraction` of
 * participants, given their entry counts sorted descending.
 */
function cutoffForFraction(sortedDesc: number[], fraction: number): number {
  const n = sortedDesc.length
  if (n === 0) return 0
  const idx = Math.min(Math.max(Math.ceil(fraction * n) - 1, 0), n - 1)
  return sortedDesc[idx]
}

/**
 * Aggregate a `{ userId, value }[]` result set into a Map, coercing the
 * (string | null) sums Drizzle returns into numbers.
 */
function toMap(rows: { userId: number; value: string | number | null }[]) {
  const map = new Map<number, number>()
  for (const row of rows) map.set(row.userId, Number(row.value ?? 0))
  return map
}

export class GetGiveawayDashboard extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Get the current user giveaway dashboard',
    responses: {
      '200': {
        description: 'Giveaway dashboard retrieved successfully',
        content: {
          'application/json': {
            schema: z.object({
              giveaway: z.object({
                entries: z.number(),
                breakdown: z.object({
                  feedbackPoints: z.number(),
                  referralPoints: z.number(),
                  bonusPoints: z.number()
                }),
                referralCount: z.number(),
                raffle: z.object({
                  topBand: z
                    .enum(['top1', 'top5', 'top10', 'top25', 'top50'])
                    .nullable(),
                  nextGoal: z
                    .object({
                      band: z.enum(['top1', 'top5', 'top10', 'top25', 'top50']),
                      entriesNeeded: z.number()
                    })
                    .nullable()
                }),
                ambassador: z.object({
                  state: z.enum(['leading', 'tied', 'contender', 'far']),
                  referralsToWin: z.number().optional(),
                  leadOverNext: z.number().optional(),
                  pendingReferrals: z.number(),
                  potentialPoints: z.number()
                }),
                boosts: z.object({
                  perfectFeedback: z.object({
                    current: z.number(),
                    threshold: z.number(),
                    bonus: z.number()
                  }),
                  instagramBonusAvailable: z.boolean()
                })
              })
            })
          }
        }
      },
      '401': {
        description: 'Authentication required',
        content: {
          'application/json': { schema: z.object({ error: z.string() }) }
        }
      }
    }
  }

  async handle(c: Context) {
    const env = c.env as Env
    const authContext = await requireAuth(c)
    const userId = authContext.user.id
    const pointService = new PointService(env)

    const db = database()

    // --- Per-user giveaway-scoped point buckets (across ALL users) ---
    // These power both the current user's entry count and the percentile
    // distribution. Kept as three aggregate queries; fine at current scale.

    // Feedback points, scoped to the giveaway school year via the feedback join.
    const feedbackRows = await db
      .select({
        userId: pointRegistry.userId,
        value: sum(pointRegistry.amount)
      })
      .from(pointRegistry)
      // referenceId is polymorphic, so sourceType is what makes it actually
      // mean feedback.id — it's part of the join relationship, not a filter.
      .innerJoin(
        feedback,
        and(
          eq(feedback.id, pointRegistry.referenceId),
          eq(pointRegistry.sourceType, 'submit_feedback')
        )
      )
      .where(eq(feedback.schoolYear, GIVEAWAY_SCHOOL_YEAR))
      .groupBy(pointRegistry.userId)

    // Referral activity (both sides), scoped to the referral window.
    const referralRows = await db
      .select({
        userId: pointRegistry.userId,
        value: sum(pointRegistry.amount)
      })
      .from(pointRegistry)
      .where(
        and(
          inArray(pointRegistry.sourceType, ['referral', 'referral_bonus']),
          gte(pointRegistry.createdAt, REFERRAL_WINDOW_START),
          lt(pointRegistry.createdAt, REFERRAL_WINDOW_END)
        )
      )
      .groupBy(pointRegistry.userId)

    // Campaign bonuses (Instagram link + perfect-feedback bonus).
    const bonusRows = await db
      .select({
        userId: pointRegistry.userId,
        value: sum(pointRegistry.amount)
      })
      .from(pointRegistry)
      .where(eq(pointRegistry.sourceType, 'bonus'))
      .groupBy(pointRegistry.userId)

    // Successful referrals per user (the referrer side only), in-window — this
    // is the Ambassador race metric.
    const recruiterRows = await db
      .select({ userId: pointRegistry.userId, value: count() })
      .from(pointRegistry)
      .where(
        and(
          eq(pointRegistry.sourceType, 'referral'),
          gte(pointRegistry.createdAt, REFERRAL_WINDOW_START),
          lt(pointRegistry.createdAt, REFERRAL_WINDOW_END)
        )
      )
      .groupBy(pointRegistry.userId)

    const feedbackMap = toMap(feedbackRows)
    const referralMap = toMap(referralRows)
    const bonusMap = toMap(bonusRows)
    const recruiterMap = toMap(recruiterRows)

    // --- Current user's own numbers ---
    const feedbackPoints = feedbackMap.get(userId) ?? 0
    const referralPoints = referralMap.get(userId) ?? 0
    const bonusPoints = bonusMap.get(userId) ?? 0
    const entries = feedbackPoints + referralPoints + bonusPoints
    const referralCount = recruiterMap.get(userId) ?? 0

    // --- Raffle percentile band (computed server-side; never leaks the raw
    // distribution or average) ---
    const participantEntries: number[] = []
    for (const uid of new Set([
      ...feedbackMap.keys(),
      ...referralMap.keys(),
      ...bonusMap.keys()
    ])) {
      const total =
        (feedbackMap.get(uid) ?? 0) +
        (referralMap.get(uid) ?? 0) +
        (bonusMap.get(uid) ?? 0)
      if (total > 0) participantEntries.push(total)
    }
    participantEntries.sort((a, b) => b - a)

    const raffle = computeRaffleStanding(entries, participantEntries)

    // --- Ambassador race (gated by proximity to the leader) ---
    // Friends who signed up with this user's code but haven't activated yet
    // (no feedback → no referral points awarded). Activating them now stamps an
    // in-window referral, so these are points the user can still unlock.
    const pendingRows = await db
      .select({ value: count() })
      .from(users)
      .where(
        and(
          eq(users.referredByUserId, userId),
          notExists(
            db
              .select({ id: feedback.id })
              .from(feedback)
              .where(eq(feedback.userId, users.id))
          )
        )
      )
    const pendingReferrals = pendingRows[0]?.value ?? 0
    const ambassador = {
      ...computeAmbassadorStanding(userId, recruiterMap),
      pendingReferrals,
      potentialPoints: pendingReferrals * REFERRAL_POINTS
    }

    // --- Boost CTAs ---
    // Always returned (even once earned) so the UI can show a completed
    // progress bar rather than hiding the card.
    const perfectCount = await pointService.countPerfectFeedbacks(
      userId,
      PERFECT_FEEDBACK_BONUS_SCHOOL_YEAR
    )
    const perfectFeedback = {
      current: perfectCount,
      threshold: PERFECT_FEEDBACK_THRESHOLD,
      bonus: PERFECT_FEEDBACK_BONUS_POINTS
    }

    const instagramBonus = await pointService.getPointsForEntry(
      userId,
      'bonus',
      1 // INSTAGRAM_BONUS_REFERENCE_ID
    )
    const instagramBonusAvailable = instagramBonus === null

    return Response.json({
      giveaway: {
        entries,
        breakdown: { feedbackPoints, referralPoints, bonusPoints },
        referralCount,
        raffle,
        ambassador,
        boosts: {
          perfectFeedback,
          instagramBonusAvailable
        }
      }
    })
  }
}

/**
 * Pure percentile logic. Returns the user's top band (only when flattering)
 * and the nearest reachable rung above them, or nulls when there aren't enough
 * participants to say anything meaningful.
 */
function computeRaffleStanding(
  entries: number,
  participantEntriesDesc: number[]
): {
  topBand: RaffleBand | null
  nextGoal: { band: RaffleBand; entriesNeeded: number } | null
} {
  const n = participantEntriesDesc.length
  if (entries <= 0 || n < MIN_PARTICIPANTS_FOR_BANDS) {
    return { topBand: null, nextGoal: null }
  }

  const strictlyGreater = participantEntriesDesc.filter(
    (e) => e > entries
  ).length
  const topFraction = strictlyGreater / n

  let currentBandIndex = -1
  for (let i = 0; i < RAFFLE_BANDS.length; i++) {
    if (topFraction <= RAFFLE_BANDS[i].fraction) {
      currentBandIndex = i
      break
    }
  }

  const topBand =
    currentBandIndex >= 0 ? RAFFLE_BANDS[currentBandIndex].band : null

  // The next better band: one index up, or the lowest band if unranked, or
  // nothing if already top1.
  let targetIndex: number
  if (currentBandIndex === -1) targetIndex = RAFFLE_BANDS.length - 1
  else if (currentBandIndex === 0) targetIndex = -1
  else targetIndex = currentBandIndex - 1

  let nextGoal: { band: RaffleBand; entriesNeeded: number } | null = null
  if (targetIndex >= 0) {
    const cutoff = cutoffForFraction(
      participantEntriesDesc,
      RAFFLE_BANDS[targetIndex].fraction
    )
    const entriesNeeded = Math.max(0, cutoff - entries)
    if (entriesNeeded > 0) {
      nextGoal = { band: RAFFLE_BANDS[targetIndex].band, entriesNeeded }
    }
  }

  return { topBand, nextGoal }
}

/**
 * Pure Ambassador-race logic. Emits only bounded deltas — never another user's
 * raw referral count — and collapses to `{ state: 'far' }` (no numbers at all)
 * once the user is out of contention.
 */
function computeAmbassadorStanding(
  userId: number,
  recruiterMap: Map<number, number>
): {
  state: 'leading' | 'tied' | 'contender' | 'far'
  referralsToWin?: number
  leadOverNext?: number
} {
  const myCount = recruiterMap.get(userId) ?? 0
  const counts = [...recruiterMap.values()]
  const leaderCount = counts.length ? Math.max(...counts) : 0
  const leaders = counts.filter((c) => c === leaderCount).length

  // Sole leader: the current user is strictly ahead of everyone else, so the
  // prize is theirs at this snapshot.
  if (leaderCount > 0 && myCount === leaderCount && leaders === 1) {
    const belowLeader = counts.filter((c) => c < leaderCount)
    const secondCount = belowLeader.length ? Math.max(...belowLeader) : 0
    return { state: 'leading', leadOverNext: leaderCount - secondCount }
  }

  // Tied at the top with someone else. We can't tell who holds the tie-break
  // (earliest to the count wins, and we don't have that timing here), so we
  // never claim either co-leader is winning. Both are told they need one more
  // referral to secure sole first place — true for the real leader (locks it
  // in) and the runner-up (takes the lead) alike.
  if (leaderCount > 0 && myCount === leaderCount) {
    return { state: 'tied', referralsToWin: 1 }
  }

  // Behind the leader → how many referrals to reach sole first place. Matching
  // the leader's count isn't enough (see tie-break above), so it's the raw gap
  // plus one. Also 1 when nobody has referred anyone yet (leaderCount 0 → the
  // race is wide open and a single referral makes you the sole leader).
  const referralsToWin = leaderCount - myCount + 1
  if (referralsToWin <= AMBASSADOR_MAX_REFERRALS_TO_WIN) {
    return { state: 'contender', referralsToWin }
  }

  // Too far back to show a concrete target — a big number would only
  // demoralize, so `far` drops all competitive data and the UI falls back to a
  // raffle-focused message.
  return { state: 'far' }
}
