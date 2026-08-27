import { CHAT_CONFIG } from '@config/chat'
import { ChatService } from '@services/chatService'
import { findFacultyByEmail } from '@utils/emailValidation'
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
      'Demasiados pedidos. Tenta novamente daqui a pouco.'
    )
  }
}

export interface ChatAccess {
  facultyId: number | null
}

/**
 * Can this user send a message right now?
 *
 * Order matters: the global switches are checked before the per-user ones, so a
 * user who is over quota during an outage is told about the outage.
 */
export async function assertCanSendMessage(
  c: Context,
  service: ChatService,
  user: { id: number; email: string }
): Promise<ChatAccess> {
  if (!CHAT_CONFIG.enabled) {
    throw new ForbiddenError(
      'O chat está a descansar. Volta a tentar mais tarde.'
    )
  }

  // Global spend ceiling. Degrades to "resting", never to an error page.
  const spent = await service.spendTodayMicros()
  if (spent >= CHAT_CONFIG.dailyCostCeilingMicros) {
    console.warn(
      `[chat] daily cost ceiling reached: ${spent} >= ${CHAT_CONFIG.dailyCostCeilingMicros} micros`
    )
    throw new ForbiddenError(
      'O chat está a descansar por hoje. Volta a tentar amanhã.'
    )
  }

  checkIpRateLimit(c)

  // The coverage wall. A student whose faculty is not enabled is not told "no",
  // they are told why and asked to help: see the plan's section 3. The API's job
  // is only to refuse; the UI turns that refusal into the ask.
  const faculty = await findFacultyByEmail(user.email)
  if (!faculty?.chatEnabled) {
    throw new ForbiddenError(
      'O chat ainda não está disponível para a tua universidade.'
    )
  }

  const usedToday = await service.countMessagesToday(user.id)
  if (usedToday >= CHAT_CONFIG.dailyMessageLimit) {
    throw new TooManyRequestsError(
      `Atingiste o limite de ${CHAT_CONFIG.dailyMessageLimit} mensagens por dia. Volta amanhã.`
    )
  }

  return { facultyId: faculty.id }
}

/** Remaining messages today, for the counter the UI shows. */
export async function remainingMessages(
  service: ChatService,
  userId: number
): Promise<number> {
  const used = await service.countMessagesToday(userId)
  return Math.max(0, CHAT_CONFIG.dailyMessageLimit - used)
}
