import {
  type RouteConfigEntry,
  index,
  layout,
  route
} from '@react-router/dev/routes'
import type { Lang } from '~/i18n/config'
import { LANG_PREFIXES, type RouteNode } from './route-map'

export function buildRoutes(
  nodes: readonly RouteNode[],
  lang: Lang
): RouteConfigEntry[] {
  return nodes.flatMap((node): RouteConfigEntry[] => {
    // Dev-only routes (e.g. the /design reference) are skipped in production
    // builds, so they never make it into the route manifest.
    if (!import.meta.env.DEV && 'devOnly' in node && node.devOnly) {
      return []
    }
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
