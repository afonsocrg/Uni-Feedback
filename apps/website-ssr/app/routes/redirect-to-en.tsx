import { redirect } from 'react-router'

import type { Route } from './+types/redirect-to-en'

// English pages used to live at the root (/browse, /profile, ...) before the
// site went Portuguese-first. Search engines still crawl those URLs, and at the
// root they now fall through to the faculty route and 404. Send them to the
// same path under /en, keeping any query string.
export function loader({ request }: Route.LoaderArgs) {
  const { pathname, search } = new URL(request.url)
  return redirect(`/en${pathname}${search}`, { status: 301 })
}
