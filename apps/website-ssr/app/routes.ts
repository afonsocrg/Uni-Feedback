import { type RouteConfig, route } from '@react-router/dev/routes'
import { buildRoutes, routeConfig } from './utils/route-map'

export default [
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
  ...buildRoutes(routeConfig, 'pt'),
  route('/en', 'routes/en-layout.tsx', buildRoutes(routeConfig, 'en'))
] satisfies RouteConfig
