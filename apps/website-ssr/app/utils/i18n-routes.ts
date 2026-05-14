import type { Lang } from '~/i18n/config'
import { routeMap } from './route-map'

export type { RouteKey } from './route-map'
export type { Lang }

export function getLocalePath(key: keyof typeof routeMap, lang: Lang): string {
  return routeMap[key].paths[lang]
}

export function detectLang(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pt'
}

// Reverse lookup tables derived from routeMap
const ptToEn: Record<string, string> = {}
const enToPt: Record<string, string> = {}
for (const key of Object.keys(routeMap) as (keyof typeof routeMap)[]) {
  ptToEn[routeMap[key].paths.pt] = routeMap[key].paths.en
  enToPt[routeMap[key].paths.en] = routeMap[key].paths.pt
}

function swapDynamicPath(path: string, from: Lang): string {
  if (from === 'pt') {
    if (path.startsWith('/cadeiras/')) {
      const rest = path.slice('/cadeiras/'.length)
      return `/en/courses/${rest}`
    }
    const editMatch = path.match(/^\/feedback\/([^/]+)\/editar$/)
    if (editMatch) return `/en/feedback/${editMatch[1]}/edit`
    return `/en${path}`
  } else {
    const withoutEn = path.slice(3) // remove '/en'
    if (withoutEn.startsWith('/courses/')) {
      const rest = withoutEn.slice('/courses/'.length)
      return `/cadeiras/${rest}`
    }
    const editMatch = withoutEn.match(/^\/feedback\/([^/]+)\/edit$/)
    if (editMatch) return `/feedback/${editMatch[1]}/editar`
    return withoutEn || '/'
  }
}

// Returns the equivalent URL in the target language, preserving query strings.
export function getEquivalentPath(fullPath: string, currentLang: Lang): string {
  const [pathOnly, query] = fullPath.split('?')
  const suffix = query ? `?${query}` : ''

  const table = currentLang === 'pt' ? ptToEn : enToPt
  if (table[pathOnly]) return table[pathOnly] + suffix

  return swapDynamicPath(pathOnly, currentLang) + suffix
}

export function getReviewPath(lang: Lang, courseId?: number): string {
  const base = getLocalePath('feedback-new', lang)
  const params = courseId ? `?courseId=${courseId}` : ''
  return `${base}${params}`
}

export function getCoursePath(lang: Lang, courseId: number): string {
  return lang === 'en' ? `/en/courses/${courseId}` : `/cadeiras/${courseId}`
}

export function getCourseFeedbackPath(lang: Lang, courseId: number): string {
  return lang === 'en'
    ? `/en/courses/${courseId}/feedback`
    : `/cadeiras/${courseId}/feedback`
}

export function getFacultyPath(lang: Lang, facultySlug: string): string {
  return lang === 'en' ? `/en/${facultySlug}` : `/${facultySlug}`
}

export function getDegreePath(
  lang: Lang,
  facultySlug: string,
  degreeSlug: string
): string {
  return lang === 'en'
    ? `/en/${facultySlug}/${degreeSlug}`
    : `/${facultySlug}/${degreeSlug}`
}
