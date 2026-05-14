/**
 * Convert a Date or timestamp to a human-readable "time ago" format
 *
 * @param date - Date object or Unix timestamp in milliseconds
 * @returns Human-readable relative time string
 *
 * @example
 * getRelativeTime(Date.now() - 1000) // "just now"
 * getRelativeTime(Date.now() - 60000) // "1 minute ago"
 * getRelativeTime(new Date('2024-01-01')) // "X days ago"
 */
export function getRelativeTime(
  date: Date | number | null,
  locale = 'en'
): string {
  if (!date) return 'Recently'

  const timestamp = typeof date === 'number' ? date : date.getTime()
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (years > 0) return rtf.format(-years, 'year')
  if (months > 0) return rtf.format(-months, 'month')
  if (weeks > 0) return rtf.format(-weeks, 'week')
  if (days > 0) return rtf.format(-days, 'day')
  if (hours > 0) return rtf.format(-hours, 'hour')
  if (minutes > 0) return rtf.format(-minutes, 'minute')
  return rtf.format(-seconds, 'second')
}
