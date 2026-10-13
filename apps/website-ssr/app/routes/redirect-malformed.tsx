import { redirect } from 'react-router'

import type { Route } from './+types/redirect-malformed'

// Mangled versions of our own URLs that external links and old crawls keep
// requesting: a doubled language prefix (/en/en/courses/1) and a truncated
// course path (/deiras/1). Fix the path and keep the query string.
export function loader({ request }: Route.LoaderArgs) {
  const { pathname, search } = new URL(request.url)
  const fixed = pathname
    .replace(/^(\/en)+\//, '/en/')
    .replace(/^\/deiras\//, '/cadeiras/')
  return redirect(`${fixed}${search}`, { status: 301 })
}
