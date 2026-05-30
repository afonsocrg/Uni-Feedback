import type { Lang } from '~/i18n/config'
import { routeMap } from './route-map'

export type { RouteKey } from './route-map'
export type { Lang }

const COURSE_SEGMENT: Record<Lang, string> = { pt: 'cadeiras', en: 'courses' }

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
    if (path.startsWith(`/${COURSE_SEGMENT.pt}/`)) {
      const rest = path.slice(`/${COURSE_SEGMENT.pt}/`.length)
      return `/en/${COURSE_SEGMENT.en}/${rest}`
    }
    const editMatch = path.match(/^\/feedback\/([^/]+)\/editar$/)
    if (editMatch) return `/en/feedback/${editMatch[1]}/edit`
    if (import.meta.env.DEV) {
      console.warn(
        `[i18n] swapDynamicPath: unrecognized PT path "${path}", falling back to /en prefix`
      )
    }
    return `/en${path}`
  } else {
    const withoutEn = path.slice(3) // remove '/en'
    if (withoutEn.startsWith(`/${COURSE_SEGMENT.en}/`)) {
      const rest = withoutEn.slice(`/${COURSE_SEGMENT.en}/`.length)
      return `/${COURSE_SEGMENT.pt}/${rest}`
    }
    const editMatch = withoutEn.match(/^\/feedback\/([^/]+)\/edit$/)
    if (editMatch) return `/feedback/${editMatch[1]}/editar`
    if (import.meta.env.DEV) {
      console.warn(
        `[i18n] swapDynamicPath: unrecognized EN path "${path}", falling back to strip /en`
      )
    }
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
  return lang === 'en'
    ? `/en/${COURSE_SEGMENT.en}/${courseId}`
    : `/${COURSE_SEGMENT.pt}/${courseId}`
}

export function getCourseFeedbackPath(lang: Lang, courseId: number): string {
  return `${getCoursePath(lang, courseId)}/feedback`
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

export function getFeedbackAnchor(
  lang: Lang,
  courseId: number,
  feedbackId: number
): string {
  return `${getCoursePath(lang, courseId)}#feedback-${feedbackId}`
}
