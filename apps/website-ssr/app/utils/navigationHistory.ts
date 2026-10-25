/**
 * The in-app page a visitor was on before the current one, for events that
 * want to know where an arrival came from (`chat_opened{referrerPage}`).
 *
 * URL params like `?source=faq` say which entry point was used, not which
 * page it sat on, and `document.referrer` is frozen at the first document load
 * because every in-app link is a client-side navigation. So the root records
 * each pathname as it changes, and this keeps the one before.
 */

let current: string | null = null
let previous: string | null = null

/** Called by the root on every pathname change */
export function recordPathname(pathname: string) {
  if (pathname === current) return
  previous = current
  current = pathname
}

/**
 * The previous in-app pathname, or, on the first page of a visit, the
 * referrer's path when it is this site (a full reload), else null (an
 * external arrival; PostHog's `$referrer` has the rest).
 */
export function getPreviousPathname(): string | null {
  if (previous) return previous
  if (typeof document === 'undefined' || !document.referrer) return null
  try {
    const url = new URL(document.referrer)
    return url.origin === window.location.origin ? url.pathname : null
  } catch {
    return null
  }
}
