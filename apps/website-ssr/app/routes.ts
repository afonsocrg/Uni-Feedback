import {
  type RouteConfig,
  index,
  layout,
  route
} from '@react-router/dev/routes'

export default [
  // Sitemap route (outside layout for clean XML response)
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
  // Auth routes (outside layout for custom full-page design)
  route('/login', 'routes/login.tsx'),
  route('/login/:token', 'routes/login.$token.tsx'),
  layout('routes/landing-layout.tsx', [
    // Public routes
    index('routes/landing.tsx'),
    route('/browse', 'routes/browse.tsx'),
    route('/:facultySlug', 'routes/$facultySlug.tsx'),
    route('/:facultySlug/:degreeSlug', 'routes/$facultySlug.$degreeSlug.tsx'),
    route('/feedback/new', 'routes/feedback.new.tsx'),
    route('/courses/:courseId', 'routes/courses.$courseId.tsx'),
    route('/partners', 'routes/partners.tsx'),
    route('/terms', 'routes/terms.tsx'),
    route('/privacy', 'routes/privacy.tsx'),
    route('/guidelines', 'routes/guidelines.tsx'),

    // Protected routes (require authentication)
    layout('routes/auth-layout.tsx', [
      route('/profile', 'routes/profile.tsx'),
      route('/feedback/:id/edit', 'routes/feedback.$id.edit.tsx')
    ])
  ])
] satisfies RouteConfig
