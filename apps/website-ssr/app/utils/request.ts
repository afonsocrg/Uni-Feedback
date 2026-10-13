/**
 * Returns the public-facing origin (scheme + host) for a request.
 *
 * Behind a reverse proxy that terminates TLS, request.url carries http://.
 * X-Forwarded-Proto contains the original scheme the client used, so we
 * prefer that when present.
 *
 * A leading `www.` is dropped: www.uni-feedback.com serves the same pages, and
 * every absolute URL we emit (canonical, hreflang, sitemap, JSON-LD) must name
 * one host, or search engines index both copies as duplicates.
 */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url)
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim()
  const host = url.host.replace(/^www\./, '')
  return `${proto || url.protocol.replace(':', '')}://${host}`
}
