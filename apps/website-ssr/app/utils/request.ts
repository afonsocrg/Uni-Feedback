/**
 * Returns the public-facing origin (scheme + host) for a request.
 *
 * Behind a reverse proxy that terminates TLS, request.url carries http://.
 * X-Forwarded-Proto contains the original scheme the client used, so we
 * prefer that when present.
 */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url)
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim()
  return proto ? `${proto}://${url.host}` : url.origin
}
