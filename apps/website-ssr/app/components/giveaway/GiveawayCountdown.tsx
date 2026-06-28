import { CalendarClock, Clock } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCountdown, useGiveawayDisplayMode, useLang } from '~/hooks'
import {
  GIVEAWAY_COUNTDOWN_THRESHOLD_DAYS,
  GIVEAWAY_END_DATE
} from '~/utils/constants'

interface GiveawayCountdownProps {
  /**
   * `hero` renders the full display (DD HH MM SS boxes, or a date badge).
   * `compact` renders a single inline pill for banners and promo bands.
   */
  variant?: 'hero' | 'compact'
  className?: string
}

/**
 * Deadline display for the Summer 2026 giveaway. Far from the deadline it shows
 * the end date ("Ends July 31"); once fewer than
 * `GIVEAWAY_COUNTDOWN_THRESHOLD_DAYS` remain it switches to a live ticking
 * countdown to build urgency. The dev panel can force either version.
 *
 * Renders nothing on the server / before mount (see `useCountdown`) or once the
 * deadline has passed. Styled for dark / colored backgrounds.
 */
export function GiveawayCountdown({
  variant = 'hero',
  className = ''
}: GiveawayCountdownProps) {
  const { t } = useTranslation('legal')
  const lang = useLang()
  const remaining = useCountdown(GIVEAWAY_END_DATE)
  const mode = useGiveawayDisplayMode()

  const endDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-US', {
        day: 'numeric',
        month: 'long',
        timeZone: 'Europe/Lisbon'
      }).format(GIVEAWAY_END_DATE),
    [lang]
  )

  if (!remaining || remaining.isExpired) return null

  const showCountdown =
    mode === 'countdown' ||
    (mode === 'auto' && remaining.days < GIVEAWAY_COUNTDOWN_THRESHOLD_DAYS)
  // "Last call" amber treatment in the final 24h.
  const urgent = remaining.days < 1

  // ── Date mode: "Ends July 31" ──────────────────────────────────────────
  if (!showCountdown) {
    const label = t('giveaway_page.ends_on', { date: endDateLabel })

    if (variant === 'compact') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold whitespace-nowrap text-white ${className}`}
        >
          <CalendarClock className="size-4 shrink-0" />
          {label}
        </span>
      )
    }

    return (
      <div className={`flex justify-center ${className}`}>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-base font-semibold text-white backdrop-blur-sm sm:text-lg">
          <CalendarClock className="size-5 shrink-0" />
          {label}
        </span>
      </div>
    )
  }

  // ── Countdown mode: live DD HH MM SS ───────────────────────────────────
  if (variant === 'compact') {
    const label =
      remaining.days >= 1
        ? t('giveaway_page.countdown_days_left', { count: remaining.days })
        : t('giveaway_page.countdown_hours_left', { count: remaining.hours })

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${
          urgent ? 'bg-amber-400 text-black' : 'bg-white/15 text-white'
        } ${className}`}
      >
        <Clock className="size-4 shrink-0" />
        {label}
      </span>
    )
  }

  // Drop leading units once they hit zero: no DAYS box under a day, no HOURS
  // box under an hour. Minutes and seconds always show.
  const units = [
    { value: remaining.days, label: t('giveaway_page.countdown_days') },
    { value: remaining.hours, label: t('giveaway_page.countdown_hours') },
    { value: remaining.minutes, label: t('giveaway_page.countdown_minutes') },
    { value: remaining.seconds, label: t('giveaway_page.countdown_seconds') }
  ].filter((unit, index) => {
    if (index === 0) return remaining.days >= 1
    if (index === 1) return remaining.days >= 1 || remaining.hours >= 1
    return true
  })

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/80">
        <Clock className="size-4" />
        {t('giveaway_page.countdown_title')}
      </p>
      <div className="flex items-stretch justify-center gap-2 sm:gap-3">
        {units.map((unit) => (
          <div
            key={unit.label}
            className={`flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 backdrop-blur-sm sm:min-w-[80px] sm:px-4 sm:py-3 ${
              urgent
                ? 'border-amber-300/50 bg-amber-400/15'
                : 'border-white/15 bg-white/10'
            }`}
          >
            <span
              className={`font-heading text-3xl font-bold tabular-nums sm:text-4xl ${
                urgent ? 'text-amber-300' : 'text-white'
              }`}
            >
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/70 sm:text-xs">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
