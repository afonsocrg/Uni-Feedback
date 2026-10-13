import { type RouteConfig, route } from '@react-router/dev/routes'
import { buildRoutes } from './utils/route-builder'
import { routeConfig } from './utils/route-map'

export default [
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
  // Legacy redirects (pre-multilingual URLs that Google has indexed)
  route(
    'courses/:courseId/feedback',
    'routes/redirect-courses.$courseId.feedback.tsx'
  ),
  route('courses/:courseId', 'routes/redirect-courses.$courseId.tsx'),
  route('courses', 'routes/redirect-courses.tsx'),
  route('partners', 'routes/redirect-partners.tsx'),
  ...[
    'browse',
    'profile',
    'profile/:tab',
    'points',
    'contact',
    'supporters',
    'terms',
    'privacy',
    'feedback/new',
    'unsubscribe'
  ].map((path) =>
    route(path, 'routes/redirect-to-en.tsx', { id: `redirect-to-en/${path}` })
  ),
  ...['en/en/*', 'deiras/*'].map((path) =>
    route(path, 'routes/redirect-malformed.tsx', {
      id: `redirect-malformed/${path}`
    })
  ),
  ...buildRoutes(routeConfig, 'pt'),
  route('/en', 'routes/en-layout.tsx', buildRoutes(routeConfig, 'en'))
] satisfies RouteConfig
