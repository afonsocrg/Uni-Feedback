import {
  type RouteConfig,
  index,
  layout,
  route
} from '@react-router/dev/routes'
import type { Lang } from './utils/route-map'
import { routeMap } from './utils/route-map'

function r(key: keyof typeof routeMap, lang: Lang) {
  const def = routeMap[key]
  const id = `${lang}/${key}`
  if (def.index) return index(def.file, { id })
  const path =
    lang === 'en' ? def.paths.en.replace(/^\/en\/?/, '') : def.paths.pt
  return route(path, def.file, { id })
}

export default [
  // Sitemap (outside all layouts)
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),

  // ── Portuguese (default, no prefix) ──────────────────────────────────────
  r('login', 'pt'),
  r('login-token', 'pt'),
  r('unsubscribe', 'pt'),

  layout('routes/landing-layout.tsx', { id: 'pt/landing-layout' }, [
    r('home', 'pt'),
    r('browse', 'pt'),
    r('giveaway', 'pt'),
    r('giveaway-rules', 'pt'),
    r('feedback-new', 'pt'),
    route('/cadeiras/:courseId', 'routes/courses.$courseId.tsx', {
      id: 'pt/course'
    }),
    route(
      '/cadeiras/:courseId/feedback',
      'routes/course.$courseId.feedback.tsx',
      { id: 'pt/course-feedback' }
    ),
    r('supporters', 'pt'),
    r('terms', 'pt'),
    r('privacy', 'pt'),
    r('guidelines', 'pt'),
    r('guidelines-full', 'pt'),
    r('points', 'pt'),
    r('contact', 'pt'),
    layout('routes/auth-layout.tsx', { id: 'pt/auth-layout' }, [
      r('profile', 'pt'),
      r('feedback-edit', 'pt')
    ]),
    route('/:facultySlug', 'routes/$facultySlug.tsx', { id: 'pt/faculty' }),
    route('/:facultySlug/:degreeSlug', 'routes/$facultySlug.$degreeSlug.tsx', {
      id: 'pt/degree'
    })
  ]),

  // ── English (/en prefix) ─────────────────────────────────────────────────
  route('/en', 'routes/en-layout.tsx', [
    r('login', 'en'),
    r('login-token', 'en'),
    r('unsubscribe', 'en'),
    layout('routes/landing-layout.tsx', { id: 'en/landing-layout' }, [
      r('home', 'en'),
      r('browse', 'en'),
      r('giveaway', 'en'),
      r('giveaway-rules', 'en'),
      r('feedback-new', 'en'),
      route('courses/:courseId', 'routes/courses.$courseId.tsx', {
        id: 'en/course'
      }),
      route(
        'courses/:courseId/feedback',
        'routes/course.$courseId.feedback.tsx',
        { id: 'en/course-feedback' }
      ),
      r('supporters', 'en'),
      r('terms', 'en'),
      r('privacy', 'en'),
      r('guidelines', 'en'),
      r('guidelines-full', 'en'),
      r('points', 'en'),
      r('contact', 'en'),
      layout('routes/auth-layout.tsx', { id: 'en/auth-layout' }, [
        r('profile', 'en'),
        r('feedback-edit', 'en')
      ]),
      route(':facultySlug', 'routes/$facultySlug.tsx', { id: 'en/faculty' }),
      route(':facultySlug/:degreeSlug', 'routes/$facultySlug.$degreeSlug.tsx', {
        id: 'en/degree'
      })
    ])
  ])
] satisfies RouteConfig
