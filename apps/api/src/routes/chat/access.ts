import { CHAT_CONFIG } from '@config/chat'
import { ChatService } from '@services/chatService'
import type { Context } from 'hono'
import { ForbiddenError, TooManyRequestsError } from '../utils'

/**
 * Everything that can stop a message before it reaches the model.
 *
 * Layered cheapest first, and all of it is v0 rather than v1: the ceiling has to
 * exist before launch day, not after a bad night.
 *
 * Plan: afonsocrg/prds/2026-08-09_ai_chat.md, section 6.
 */

/**
 * Per-IP hourly counter.
 *
 * In memory on purpose. This is a second line behind the per-user quota, which
 * is the real ceiling and is durable in the database. A process restart clearing
 * it is acceptable; a Redis dependency for the alpha is not.
 */
const ipHits = new Map<string, { count: number; resetAt: number }>()

function clientIp(c: Context): string {
  return (
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  )
}

/**
 * Machine-readable reason on a refusal, so the client can tell them apart.
 *
 * Without it every refusal is a bare 403 and the UI has to guess, which is how
 * a student hitting the kill switch used to be told we lacked data about their
 * university. The message is for the student; the code is for the branch.
 */
export type ChatRefusalCode =
  | 'chat_resting'
  | 'spend_ceiling'
  | 'ip_rate_limit'
  | 'quota'

export function checkIpRateLimit(c: Context): void {
  const ip = clientIp(c)
  if (ip === 'unknown') return

  const now = Date.now()
  const entry = ipHits.get(ip)

  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return
  }

  entry.count += 1
  if (entry.count > CHAT_CONFIG.hourlyIpLimit) {
    throw new TooManyRequestsError(
      'Too many requests. Try again in a little while.',
      { data: { code: 'ip_rate_limit' satisfies ChatRefusalCode } }
    )
  }
}

/**
 * Can this user send a message right now?
 *
 * Order matters: the global switches are checked before the per-user ones, so a
 * user who is over quota during an outage is told about the outage.
 *
 * **There is no per-faculty gate.** It was removed before launch: blocking a
 * student because we guessed we had nothing useful for their university also
 * blocked the signup and the question that would have told us what they wanted,
 * which is the whole reason the chat logs exist. The thin-data case is handled
 * in the answer (see the gap detection in `ChatService`) rather than at the
 * door. Cost was never the reason either: Phase 0 measured a refusal at ~0.005
 * EUR and zero tool calls, against the daily ceiling above.
 */
export async function assertCanSendMessage(
  c: Context,
  service: ChatService,
  user: { id: number }
): Promise<void> {
  if (!CHAT_CONFIG.enabled) {
    throw new ForbiddenError('The chat is resting. Try again later.', {
      data: { code: 'chat_resting' satisfies ChatRefusalCode }
    })
  }

  // Global spend ceiling. Degrades to "resting", never to an error page.
  const spent = await service.spendTodayMicros()
  if (spent >= CHAT_CONFIG.dailyCostCeilingMicros) {
    console.warn(
      `[chat] daily cost ceiling reached: ${spent} >= ${CHAT_CONFIG.dailyCostCeilingMicros} micros`
    )
    throw new ForbiddenError(
      'The chat is resting for today. Come back tomorrow.',
      { data: { code: 'spend_ceiling' satisfies ChatRefusalCode } }
    )
  }

  checkIpRateLimit(c)

  const usedToday = await service.countMessagesToday(user.id)
  if (usedToday >= CHAT_CONFIG.dailyMessageLimit) {
    throw new TooManyRequestsError(
      `You have reached the limit of ${CHAT_CONFIG.dailyMessageLimit} messages per day. Come back tomorrow.`,
      { data: { code: 'quota' satisfies ChatRefusalCode } }
    )
  }
}

/** Remaining messages today, for the counter the UI shows. */
export async function remainingMessages(
  service: ChatService,
  userId: number
): Promise<number> {
  const used = await service.countMessagesToday(userId)
  return Math.max(0, CHAT_CONFIG.dailyMessageLimit - used)
}
