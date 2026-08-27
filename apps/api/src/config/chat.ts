/**
 * AI chat configuration.
 *
 * Every limit here exists because of a measurement from the Phase 0 spike, not a
 * guess. The numbers are cheap to change; the reasons are written down so a
 * future change is a decision rather than a shrug.
 */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined) return fallback
  return raw === 'true' || raw === '1'
}

export const CHAT_CONFIG = {
  /**
   * Master switch. When false the chat refuses every request with a friendly
   * message, whatever the database says.
   *
   * This is the "back tomorrow" lever, and it needs to exist before launch day
   * rather than be added after a bad night.
   */
  get enabled(): boolean {
    return envBool('CHAT_ENABLED', true)
  },

  /**
   * Messages per user per day.
   *
   * A ceiling against abuse, NOT a currency. Do not sell messages for feedback:
   * a student has roughly six courses a semester and reviews them in one burst,
   * so feedback is not a renewable resource, and paying for reviews buys volume
   * at the cost of the honesty that makes them worth having.
   *
   * Sized against comparison questions, which the spike measured at ~$0.085 and
   * up to 14s, not against the ~$0.008 average of a refusal.
   *
   * 30 rather than 10: a cap that bites hurts the alpha, whose whole job is to
   * learn how students use this. The GLOBAL daily ceiling below is the real
   * protection, because it bounds total spend however the messages distribute;
   * this per-user cap only stops one person eating the whole budget. Revisit
   * once the real distribution is visible: the right number is above p95.
   */
  get dailyMessageLimit(): number {
    return envInt('CHAT_DAILY_MESSAGE_LIMIT', 30)
  },

  /** Messages per IP per hour, for the shared-account case. */
  get hourlyIpLimit(): number {
    return envInt('CHAT_HOURLY_IP_LIMIT', 40)
  },

  /**
   * Global spend ceiling per day, in micro-euros. Above this the chat rests
   * until tomorrow rather than quietly draining the account.
   * Default: 5 EUR/day.
   */
  get dailyCostCeilingMicros(): number {
    return envInt('CHAT_DAILY_COST_CEILING_MICROS', 5_000_000)
  },

  /**
   * Hard cap on tool-calling round trips within a single answer.
   *
   * The spike's most expensive legitimate question (comparing computer science
   * at two universities) used 6. Eight leaves headroom without letting a loop
   * run away.
   */
  get maxToolIterations(): number {
    return envInt('CHAT_MAX_TOOL_ITERATIONS', 8)
  },

  /** Messages kept as conversation history, oldest trimmed first. */
  get maxHistoryMessages(): number {
    return envInt('CHAT_MAX_HISTORY_MESSAGES', 20)
  },

  /**
   * The model answering. Overridable per environment so a cheaper tier can be
   * tried without a deploy.
   */
  get model(): string {
    return process.env.CHAT_MODEL || 'openai/gpt-4o'
  },

  /** Cheap tier, for titles and anything else that is not the answer itself. */
  get cheapModel(): string {
    return process.env.CHAT_CHEAP_MODEL || 'openai/gpt-4o-mini'
  }
} as const

export const CHAT_LIMITS = {
  MAX_MESSAGE_CHARS: 2000,
  MAX_TITLE_CHARS: 80
} as const
