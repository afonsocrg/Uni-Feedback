import type { Lang } from '~/i18n/config'
import { LANG_PREFIXES, type RouteKey, routeMap } from './route-map'

export type { Lang, RouteKey }

const COURSE_SEGMENT: Record<Lang, string> = { pt: 'cadeiras', en: 'courses' }
const TEACHER_SEGMENT: Record<Lang, string> = {
  pt: 'professores',
  en: 'professors'
}

export function getLocalePath(key: RouteKey, lang: Lang): string {
  const def = routeMap[key]
  const prefix = LANG_PREFIXES[lang]
  if ('index' in def) return prefix ?? '/'
  const slug = def.slugs[lang]
  return prefix != null ? `${prefix}/${slug}` : `/${slug}`
}

export function detectLang(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pt'
}

// Reverse lookup tables derived from routeMap
const ptToEn: Record<string, string> = {}
const enToPt: Record<string, string> = {}
for (const key of Object.keys(routeMap) as RouteKey[]) {
  const def = routeMap[key]
  if ('index' in def) {
    ptToEn[LANG_PREFIXES.pt ?? '/'] = LANG_PREFIXES.en ?? '/'
    enToPt[LANG_PREFIXES.en ?? '/'] = LANG_PREFIXES.pt ?? '/'
  } else {
    const ptPath = `${LANG_PREFIXES.pt != null ? LANG_PREFIXES.pt : ''}/${def.slugs.pt}`
    const enPath = `${LANG_PREFIXES.en != null ? LANG_PREFIXES.en : ''}/${def.slugs.en}`
    ptToEn[ptPath] = enPath
    enToPt[enPath] = ptPath
  }
}

function swapDynamicPath(path: string, from: Lang): string {
  if (from === 'pt') {
    if (path.startsWith(`/${COURSE_SEGMENT.pt}/`)) {
      const rest = path.slice(`/${COURSE_SEGMENT.pt}/`.length)
      return `/en/${COURSE_SEGMENT.en}/${rest}`
    }
    if (path.startsWith(`/${TEACHER_SEGMENT.pt}/`)) {
      const rest = path.slice(`/${TEACHER_SEGMENT.pt}/`.length)
      return `/en/${TEACHER_SEGMENT.en}/${rest}`
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
    if (withoutEn.startsWith(`/${TEACHER_SEGMENT.en}/`)) {
      const rest = withoutEn.slice(`/${TEACHER_SEGMENT.en}/`.length)
      return `/${TEACHER_SEGMENT.pt}/${rest}`
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

export function getTeacherPath(lang: Lang, teacherId: number): string {
  return lang === 'en'
    ? `/en/${TEACHER_SEGMENT.en}/${teacherId}`
    : `/${TEACHER_SEGMENT.pt}/${teacherId}`
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

export function getFeedbackEditPath(lang: Lang, feedbackId: number): string {
  return lang === 'en'
    ? `/en/feedback/${feedbackId}/edit`
    : `/feedback/${feedbackId}/editar`
}

export function getFeedbackAnchor(
  lang: Lang,
  courseId: number,
  feedbackId: number
): string {
  return `${getCoursePath(lang, courseId)}#feedback-${feedbackId}`
}
