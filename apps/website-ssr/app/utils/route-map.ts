/**
 * Single source of truth for all website routes.
 *
 * SCHEMA
 * ──────
 * `routeConfig` is a tree of `RouteNode` items that mirrors the React Router
 * layout hierarchy. There are two node shapes:
 *
 *   Layout node — wraps children in a shared layout component:
 *     { layout: true, file: 'routes/my-layout.tsx', children: [...] }
 *
 *   Route node — a navigable page, one of:
 *     { key, file, slugs: { pt: '...', en: '...' } }   ← regular route
 *     { key, file, index: true }                        ← index route (no path)
 *
 *   `key`   — unique identifier used for typed link generation via `getLocalePath`.
 *             `RouteKey` is inferred automatically from the keys defined here,
 *             so adding a route immediately extends the type with no extra steps.
 *   `file`  — path to the route file relative to `app/`
 *   `slugs` — language-specific URL segments WITHOUT leading slash or /en prefix;
 *             those are added automatically by `buildRoutes` using `LANG_PREFIXES`
 *             Dynamic segments use React Router syntax: `:paramName`
 *
 * HOW TO ADD A NEW ROUTE
 * ──────────────────────
 * Add the route node to routeConfig in the correct layout group. That's it —
 * `RouteKey`, `buildRoutes`, and `getLocalePath` all update automatically.
 *
 * Example:
 *   { key: 'my-new-page', file: 'routes/my-new-page.tsx', slugs: { pt: 'nova-pagina', en: 'new-page' } }
 *
 * Note: key typos inside routeConfig are not caught by TypeScript (key is `string`).
 * Typos at call sites — e.g. getLocalePath('wrong-key', lang) — are caught.
 */
import type { Lang } from '~/i18n/config'

export type { Lang }
export type Slugs = Record<Lang, string>

// Language prefix config — null means default language (no prefix, routes at root)
export const LANG_PREFIXES: Record<Lang, string | null> = {
  pt: null,
  en: '/en'
}

export type RouteDef = { key: string; file: string; devOnly?: boolean } & (
  | { index: true }
  | { slugs: Slugs }
)

export type LayoutDef = {
  layout: true
  file: string
  children: readonly RouteNode[]
}

export type RouteNode = RouteDef | LayoutDef

type ExtractKeys<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends { readonly key: infer Key extends string }
    ? Key
    : T[K] extends { readonly children: infer C extends readonly unknown[] }
      ? ExtractKeys<C>
      : never
}[number]

export const routeConfig = [
  {
    key: 'login',
    file: 'routes/login.tsx',
    slugs: { pt: 'login', en: 'login' }
  },
  // Chat lives OUTSIDE the site layout on purpose. It is an application
  // surface, not a page: full viewport, its own sidebar, composer pinned to
  // the bottom. A site header and footer wrapped around it would fight the
  // scroll container and make it read as a page that happens to contain a
  // chat. The way back to the site is inside the chat's own chrome.
  {
    key: 'chat',
    file: 'routes/chat.tsx',
    slugs: { pt: 'chat', en: 'chat' }
  },
  {
    key: 'chat-detail',
    file: 'routes/chat.$chatId.tsx',
    slugs: { pt: 'chat/:chatId', en: 'chat/:chatId' }
  },
  {
    key: 'login-token',
    file: 'routes/login.$token.tsx',
    slugs: { pt: 'login/:token', en: 'login/:token' }
  },
  {
    key: 'unsubscribe',
    file: 'routes/unsubscribe.tsx',
    slugs: { pt: 'cancelar-subscricao', en: 'unsubscribe' }
  },
  // Dev-only design-system reference. Top-level (not under landing-layout) so it
  // can render the layout itself inside the light/dark comparison slider.
  {
    key: 'design',
    file: 'routes/design.tsx',
    slugs: { pt: 'design', en: 'design' },
    devOnly: true
  },

  {
    layout: true,
    file: 'routes/landing-layout.tsx',
    children: [
      {
        index: true,
        key: 'home',
        file: 'routes/landing.tsx'
      },
      {
        key: 'browse',
        file: 'routes/browse.tsx',
        slugs: { pt: 'procurar', en: 'browse' }
      },
      {
        key: 'giveaway',
        file: 'routes/giveaway.tsx',
        slugs: { pt: 'giveaway', en: 'giveaway' }
      },
      {
        key: 'giveaway-rules',
        file: 'routes/giveaway.rules.tsx',
        slugs: { pt: 'giveaway/regras', en: 'giveaway/rules' }
      },
      {
        key: 'giveaway-results',
        file: 'routes/giveaway.results.tsx',
        slugs: { pt: 'giveaway/resultados', en: 'giveaway/results' }
      },
      {
        key: 'giveaway-feb-2026',
        file: 'routes/giveaway.feb-2026.tsx',
        slugs: { pt: 'giveaway/feb-2026', en: 'giveaway/feb-2026' }
      },
      {
        key: 'giveaway-feb-2026-rules',
        file: 'routes/giveaway.feb-2026.rules.tsx',
        slugs: {
          pt: 'giveaway/feb-2026/regras',
          en: 'giveaway/feb-2026/rules'
        }
      },
      {
        key: 'feedback-new',
        file: 'routes/feedback.new.tsx',
        slugs: { pt: 'feedback/novo', en: 'feedback/new' }
      },
      {
        key: 'course',
        file: 'routes/courses.$courseId.tsx',
        slugs: { pt: 'cadeiras/:courseId', en: 'courses/:courseId' }
      },
      {
        key: 'course-feedback',
        file: 'routes/course.$courseId.feedback.tsx',
        slugs: {
          pt: 'cadeiras/:courseId/feedback',
          en: 'courses/:courseId/feedback'
        }
      },
      {
        key: 'supporters',
        file: 'routes/supporters.tsx',
        slugs: { pt: 'apoiantes', en: 'supporters' }
      },
      {
        key: 'terms',
        file: 'routes/terms.tsx',
        slugs: { pt: 'termos', en: 'terms' }
      },
      {
        key: 'privacy',
        file: 'routes/privacy.tsx',
        slugs: { pt: 'privacidade', en: 'privacy' }
      },
      {
        key: 'guidelines',
        file: 'routes/guidelines.tsx',
        slugs: { pt: 'guidelines', en: 'guidelines' }
      },
      {
        key: 'guidelines-full',
        file: 'routes/guidelines.full.tsx',
        slugs: { pt: 'guidelines/completas', en: 'guidelines/full' }
      },
      {
        key: 'points',
        file: 'routes/points.tsx',
        slugs: { pt: 'pontos', en: 'points' }
      },
      {
        key: 'contact',
        file: 'routes/contact.tsx',
        slugs: { pt: 'contacto', en: 'contact' }
      },
      {
        layout: true,
        file: 'routes/auth-layout.tsx',
        children: [
          {
            key: 'profile',
            file: 'routes/profile.tsx',
            slugs: { pt: 'perfil', en: 'profile' }
          },
          // Same component as `profile`, reached with an explicit tab segment so
          // every profile tab has a permalink (/perfil/percurso, /perfil/feedback).
          // `:tab` is a localized segment; i18n-routes maps it to a tab id.
          {
            key: 'profile-tab',
            file: 'routes/profile.tsx',
            slugs: { pt: 'perfil/:tab', en: 'profile/:tab' }
          },
          {
            key: 'feedback-edit',
            file: 'routes/feedback.$id.edit.tsx',
            slugs: { pt: 'feedback/:id/editar', en: 'feedback/:id/edit' }
          }
        ]
      },
      // Universities (prds/content_rich_pages.md decision 6). Static `unis`
      // ranks above the faculty and degree catch-alls.
      {
        key: 'universities',
        file: 'routes/universities.tsx',
        slugs: { pt: 'unis', en: 'unis' }
      },
      {
        key: 'university',
        file: 'routes/university.tsx',
        slugs: { pt: 'unis/:uniSlug', en: 'unis/:uniSlug' }
      },
      {
        key: 'university-faculties',
        file: 'routes/university-faculties.tsx',
        slugs: { pt: 'unis/:uniSlug/faculdades', en: 'unis/:uniSlug/faculties' }
      },
      {
        key: 'university-bachelors',
        file: 'routes/university-bachelors.tsx',
        slugs: {
          pt: 'unis/:uniSlug/licenciaturas',
          en: 'unis/:uniSlug/bachelors'
        }
      },
      {
        key: 'university-degrees',
        file: 'routes/university-degrees.tsx',
        slugs: { pt: 'unis/:uniSlug/cursos', en: 'unis/:uniSlug/degrees' }
      },
      // A university's degrees of one type, across its faculties. One file
      // behind the five routes; licenciaturas keep their own page (above),
      // with the 1ª fase grades.
      {
        key: 'university-integrated-masters',
        file: 'routes/university-degrees.tsx',
        slugs: {
          pt: 'unis/:uniSlug/mestrados-integrados',
          en: 'unis/:uniSlug/integrated-masters'
        }
      },
      {
        key: 'university-masters',
        file: 'routes/university-degrees.tsx',
        slugs: { pt: 'unis/:uniSlug/mestrados', en: 'unis/:uniSlug/masters' }
      },
      {
        key: 'university-minors',
        file: 'routes/university-degrees.tsx',
        slugs: { pt: 'unis/:uniSlug/minors', en: 'unis/:uniSlug/minors' }
      },
      {
        key: 'university-postgraduate',
        file: 'routes/university-degrees.tsx',
        slugs: {
          pt: 'unis/:uniSlug/pos-graduacoes',
          en: 'unis/:uniSlug/postgraduate'
        }
      },
      {
        key: 'university-phd',
        file: 'routes/university-degrees.tsx',
        slugs: { pt: 'unis/:uniSlug/doutoramentos', en: 'unis/:uniSlug/phd' }
      },
      {
        key: 'faculty',
        file: 'routes/$facultySlug.tsx',
        slugs: { pt: ':facultySlug', en: ':facultySlug' }
      },
      // A faculty's degrees of one type (prds/content_rich_pages.md, "Degree
      // type"). Static segments rank above `:facultySlug/:degreeSlug`, so these
      // words are reserved as degree slugs (utils/facultyTypePages.ts).
      {
        key: 'faculty-bachelors',
        file: 'routes/faculty-degree-type.tsx',
        slugs: {
          pt: ':facultySlug/licenciaturas',
          en: ':facultySlug/bachelors'
        }
      },
      {
        key: 'faculty-integrated-masters',
        file: 'routes/faculty-degree-type.tsx',
        slugs: {
          pt: ':facultySlug/mestrados-integrados',
          en: ':facultySlug/integrated-masters'
        }
      },
      {
        key: 'faculty-masters',
        file: 'routes/faculty-degree-type.tsx',
        slugs: { pt: ':facultySlug/mestrados', en: ':facultySlug/masters' }
      },
      {
        key: 'faculty-minors',
        file: 'routes/faculty-degree-type.tsx',
        slugs: { pt: ':facultySlug/minors', en: ':facultySlug/minors' }
      },
      {
        key: 'faculty-postgraduate',
        file: 'routes/faculty-degree-type.tsx',
        slugs: {
          pt: ':facultySlug/pos-graduacoes',
          en: ':facultySlug/postgraduate'
        }
      },
      {
        key: 'faculty-phd',
        file: 'routes/faculty-degree-type.tsx',
        slugs: { pt: ':facultySlug/doutoramentos', en: ':facultySlug/phd' }
      },
      {
        key: 'degree',
        file: 'routes/$facultySlug.$degreeSlug.tsx',
        slugs: {
          pt: ':facultySlug/:degreeSlug',
          en: ':facultySlug/:degreeSlug'
        }
      },
      // A degree's full course browser. Static segments rank above dynamic
      // ones, so /cadeiras/:courseId/feedback is never read as a degree.
      {
        key: 'degree-courses',
        file: 'routes/degree-courses.tsx',
        slugs: {
          pt: ':facultySlug/:degreeSlug/cadeiras',
          en: ':facultySlug/:degreeSlug/courses'
        }
      },
      // A degree's feature sub-pages (prds/content_rich_pages.md decision 22)
      {
        key: 'degree-admission',
        file: 'routes/degree-admission.tsx',
        slugs: {
          pt: ':facultySlug/:degreeSlug/ingresso',
          en: ':facultySlug/:degreeSlug/admission'
        }
      },
      {
        key: 'degree-careers',
        file: 'routes/degree-careers.tsx',
        slugs: {
          pt: ':facultySlug/:degreeSlug/saidas-profissionais',
          en: ':facultySlug/:degreeSlug/careers'
        }
      }
    ]
  }
] as const satisfies readonly RouteNode[]

export type RouteKey = ExtractKeys<typeof routeConfig>

// Flat map derived from the tree — used for link generation
type FlatRouteEntry = { file: string } & ({ index: true } | { slugs: Slugs })

function buildFlatMap(
  nodes: readonly RouteNode[]
): Record<RouteKey, FlatRouteEntry> {
  const result: Partial<Record<RouteKey, FlatRouteEntry>> = {}
  for (const node of nodes) {
    if ('layout' in node) {
      Object.assign(result, buildFlatMap(node.children))
    } else if ('index' in node) {
      result[node.key as RouteKey] = { file: node.file, index: true }
    } else {
      result[node.key as RouteKey] = { file: node.file, slugs: node.slugs }
    }
  }
  return result as Record<RouteKey, FlatRouteEntry>
}

export const routeMap = buildFlatMap(routeConfig)
