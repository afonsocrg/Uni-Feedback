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
export function getRelativeTime(date: Date | number | null): string {
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

  if (years > 0) return years === 1 ? '1 year ago' : `${years} years ago`
  if (months > 0) return months === 1 ? '1 month ago' : `${months} months ago`
  if (weeks > 0) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  if (days > 0) return days === 1 ? '1 day ago' : `${days} days ago`
  if (hours > 0) return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  if (minutes > 0)
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  return 'just now'
}
