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
import {
  type RouteConfigEntry,
  index,
  layout,
  route
} from '@react-router/dev/routes'
import type { Lang } from '~/i18n/config'

export type { Lang }
export type Slugs = Record<Lang, string>

// Language prefix config — null means default language (no prefix, routes at root)
export const LANG_PREFIXES: Record<Lang, string | null> = {
  pt: null,
  en: '/en'
}

export type RouteDef = { key: string; file: string } & (
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
        file: 'routes/apoiantes.tsx',
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
          {
            key: 'feedback-edit',
            file: 'routes/feedback.$id.edit.tsx',
            slugs: { pt: 'feedback/:id/editar', en: 'feedback/:id/edit' }
          }
        ]
      },
      {
        key: 'faculty',
        file: 'routes/$facultySlug.tsx',
        slugs: { pt: ':facultySlug', en: ':facultySlug' }
      },
      {
        key: 'degree',
        file: 'routes/$facultySlug.$degreeSlug.tsx',
        slugs: {
          pt: ':facultySlug/:degreeSlug',
          en: ':facultySlug/:degreeSlug'
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

export function buildRoutes(
  nodes: readonly RouteNode[],
  lang: Lang
): RouteConfigEntry[] {
  return nodes.flatMap((node): RouteConfigEntry[] => {
    if ('layout' in node) {
      const id = `${lang}/${node.file.replace(/^routes\//, '').replace(/\.tsx?$/, '')}`
      return [layout(node.file, { id }, buildRoutes(node.children, lang))]
    }
    const id = `${lang}/${node.key}`
    if ('index' in node) return [index(node.file, { id })]
    const slug = node.slugs[lang]
    const path = LANG_PREFIXES[lang] === null ? `/${slug}` : slug
    return [route(path, node.file, { id })]
  })
}
