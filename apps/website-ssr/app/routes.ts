import {
  type RouteConfig,
  index,
  layout,
  route
} from '@react-router/dev/routes'

export default [
  // Sitemap route (outside layout for clean XML response)
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
  route('/landing', 'routes/landing.tsx'),
  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('/feedback/new', 'routes/feedback.new.tsx'),
    route('/:facultySlug', 'routes/$facultySlug.tsx'),
    route('/:facultySlug/:degreeSlug', 'routes/$facultySlug.$degreeSlug.tsx'),
    route('/courses/:courseId', 'routes/courses.$courseId.tsx'),
    route('/terms', 'routes/terms.tsx'),
    route('/privacy', 'routes/privacy.tsx')
  ])
] satisfies RouteConfig
