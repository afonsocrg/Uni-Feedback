import type { Lang } from '~/i18n/config'
import type { FeedbackLinkSource } from './analytics'
import {
  FACULTY_TYPE_SEGMENTS,
  type FacultyTypePage,
  facultyTypeFromSegment,
  getFacultyTypePath
} from './facultyTypePages'
import { LANG_PREFIXES, type RouteKey, routeMap } from './route-map'

export type { Lang, RouteKey }

const COURSE_SEGMENT: Record<Lang, string> = { pt: 'cadeiras', en: 'courses' }

export function getLocalePath(key: RouteKey, lang: Lang): string {
  const def = routeMap[key]
  const prefix = LANG_PREFIXES[lang]
  if ('index' in def) return prefix ?? '/'
  const slug = def.slugs[lang]
  return prefix != null ? `${prefix}/${slug}` : `/${slug}`
}

/**
 * Login page that sends the user back to `returnTo` once they sign in.
 * Pass the current path + search so signing in from any page lands you there.
 * Coming from the login page itself carries no redirect.
 */
export function getLoginPath(lang: Lang, returnTo?: string): string {
  const loginPath = getLocalePath('login', lang)
  const target = getSafeRedirect(returnTo)
  if (!target || target.split(/[?#]/)[0] === loginPath) return loginPath
  return `${loginPath}?redirect=${encodeURIComponent(target)}`
}

/** Only same-site paths are valid redirect targets (no `//host` or `https://`). */
export function getSafeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || /^\/[/\\]/.test(value)) return null
  return value
}

/** Profile tabs, each addressable at /perfil/<segment>. */
// 'giveaway' was retired with the campaign; old /perfil/giveaway links and saved
// tab preferences fall back to the default below.
export const PROFILE_TABS = ['journey', 'feedback'] as const
export type ProfileTab = (typeof PROFILE_TABS)[number]
export const DEFAULT_PROFILE_TAB: ProfileTab = 'journey'

/** URL segment per tab and language. The tab id itself is never in the URL. */
const PROFILE_TAB_SEGMENTS: Record<ProfileTab, Record<Lang, string>> = {
  journey: { pt: 'percurso', en: 'journey' },
  feedback: { pt: 'feedback', en: 'feedback' }
}

export function isProfileTab(value: unknown): value is ProfileTab {
  return PROFILE_TABS.includes(value as ProfileTab)
}

export function getProfileTabSegment(lang: Lang, tab: ProfileTab): string {
  return PROFILE_TAB_SEGMENTS[tab][lang]
}

/**
 * The tab a URL segment points to. Accepts the other language's segment too,
 * so /perfil/journey still opens the tab (the page then canonicalises it).
 */
export function getProfileTabFromSegment(
  segment: string | undefined
): ProfileTab | null {
  if (!segment) return null
  return (
    PROFILE_TABS.find((tab) =>
      Object.values(PROFILE_TAB_SEGMENTS[tab]).includes(segment)
    ) ?? null
  )
}

/** /perfil when no tab is given, /perfil/<segment> otherwise. */
export function getProfilePath(lang: Lang, tab?: ProfileTab): string {
  const base = getLocalePath('profile', lang)
  return tab ? `${base}/${getProfileTabSegment(lang, tab)}` : base
}

/** True for /perfil and any of its tab permalinks. */
export function isProfilePath(pathname: string, lang: Lang): boolean {
  const base = getLocalePath('profile', lang)
  return pathname === base || pathname.startsWith(`${base}/`)
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
  // Profile tabs share one component behind /perfil/:tab, so the generic table
  // above only holds the literal ":tab" entry. Swap the base and translate the
  // tab segment (unknown segments are kept and canonicalised by the page).
  const profileBase = getLocalePath('profile', from)
  if (path.startsWith(`${profileBase}/`)) {
    const segment = path.slice(profileBase.length + 1)
    const to: Lang = from === 'pt' ? 'en' : 'pt'
    const tab = getProfileTabFromSegment(segment)
    return tab
      ? getProfilePath(to, tab)
      : `${getLocalePath('profile', to)}/${segment}`
  }

  if (from === 'pt') {
    if (path.startsWith(`/${COURSE_SEGMENT.pt}/`)) {
      const rest = path.slice(`/${COURSE_SEGMENT.pt}/`.length)
      return `/en/${COURSE_SEGMENT.en}/${rest}`
    }
    const editMatch = path.match(/^\/feedback\/([^/]+)\/editar$/)
    if (editMatch) return `/en/feedback/${editMatch[1]}/edit`
    // University sub-pages: /unis/ulisboa/faculdades, /unis/ulisboa/mestrados
    const uniSub = path.match(/^\/unis\/([^/]+)\/([^/]+)$/)
    const uniSubPath =
      uniSub && swapUniversitySubpage(uniSub[1], uniSub[2], 'pt')
    if (uniSubPath) return uniSubPath
    // A degree's sub-pages: /ist/leic-a/ingresso, /ist/leic-a/saidas-profissionais
    const degreeSub = path.match(
      /^\/([^/]+)\/([^/]+)\/(ingresso|saidas-profissionais)$/
    )
    if (degreeSub)
      return getDegreeSubpagePath(
        'en',
        degreeSub[1],
        degreeSub[2],
        degreeSub[3] === 'ingresso' ? 'admission' : 'careers'
      )
    // A faculty's type page: /ist/licenciaturas
    const typePage = path.match(/^\/([^/]+)\/([^/]+)$/)
    const ptType = typePage && facultyTypeFromSegment(typePage[2], 'pt')
    if (typePage && ptType) return getFacultyTypePath('en', typePage[1], ptType)
    // A degree's course browser: /ist/leic-a/cadeiras
    const degreeCourses = path.match(/^\/([^/]+)\/([^/]+)\/cadeiras$/)
    if (degreeCourses)
      return getDegreeCoursesPath('en', degreeCourses[1], degreeCourses[2])
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
    const uniSub = withoutEn.match(/^\/unis\/([^/]+)\/([^/]+)$/)
    const uniSubPath =
      uniSub && swapUniversitySubpage(uniSub[1], uniSub[2], 'en')
    if (uniSubPath) return uniSubPath
    const degreeSub = withoutEn.match(
      /^\/([^/]+)\/([^/]+)\/(admission|careers)$/
    )
    if (degreeSub)
      return getDegreeSubpagePath(
        'pt',
        degreeSub[1],
        degreeSub[2],
        degreeSub[3] === 'admission' ? 'admission' : 'careers'
      )
    const typePage = withoutEn.match(/^\/([^/]+)\/([^/]+)$/)
    const enType = typePage && facultyTypeFromSegment(typePage[2], 'en')
    if (typePage && enType) return getFacultyTypePath('pt', typePage[1], enType)
    const degreeCourses = withoutEn.match(/^\/([^/]+)\/([^/]+)\/courses$/)
    if (degreeCourses)
      return getDegreeCoursesPath('pt', degreeCourses[1], degreeCourses[2])
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

/** `from` tags the link for `feedback_browser_viewed`. */
export function getReviewPath(lang: Lang, from?: FeedbackLinkSource): string {
  const base = getLocalePath('feedback-new', lang)
  return from ? `${base}?from=${from}` : base
}

export function getCoursePath(lang: Lang, courseId: number): string {
  return lang === 'en'
    ? `/en/${COURSE_SEGMENT.en}/${courseId}`
    : `/${COURSE_SEGMENT.pt}/${courseId}`
}

/** `from` tags the link for `feedback_form_viewed.entry_point`. */
export function getCourseFeedbackPath(
  lang: Lang,
  courseId: number,
  from?: FeedbackLinkSource
): string {
  const path = `${getCoursePath(lang, courseId)}/feedback`
  return from ? `${path}?from=${from}` : path
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

/** A degree's course browser: /ist/leic-a/cadeiras, /en/ist/leic-a/courses */
export function getDegreeCoursesPath(
  lang: Lang,
  facultySlug: string,
  degreeSlug: string
): string {
  return `${getDegreePath(lang, facultySlug, degreeSlug)}/${COURSE_SEGMENT[lang]}`
}

const DEGREE_SUBPAGE_SEGMENT = {
  admission: { pt: 'ingresso', en: 'admission' },
  careers: { pt: 'saidas-profissionais', en: 'careers' }
} as const satisfies Record<string, Record<Lang, string>>

export type DegreeSubpage = keyof typeof DEGREE_SUBPAGE_SEGMENT

/** /ist/leic-a/ingresso, /en/ist/leic-a/careers */
export function getDegreeSubpagePath(
  lang: Lang,
  facultySlug: string,
  degreeSlug: string,
  page: DegreeSubpage
): string {
  return `${getDegreePath(lang, facultySlug, degreeSlug)}/${DEGREE_SUBPAGE_SEGMENT[page][lang]}`
}

/** /ist/leic-a/ingresso, /en/ist/leic-a/admission */
export function getDegreeAdmissionPath(
  lang: Lang,
  facultySlug: string,
  degreeSlug: string
): string {
  return getDegreeSubpagePath(lang, facultySlug, degreeSlug, 'admission')
}

/** /ist/leic-a/saidas-profissionais, /en/ist/leic-a/careers */
export function getDegreeCareersPath(
  lang: Lang,
  facultySlug: string,
  degreeSlug: string
): string {
  return getDegreeSubpagePath(lang, facultySlug, degreeSlug, 'careers')
}

/** /unis/ulisboa, /en/unis/ulisboa */
export function getUniversityPath(lang: Lang, uniSlug: string): string {
  return lang === 'en' ? `/en/unis/${uniSlug}` : `/unis/${uniSlug}`
}

const UNIVERSITY_SUBPAGE_SEGMENT = {
  faculties: { pt: 'faculdades', en: 'faculties' },
  bachelors: { pt: 'licenciaturas', en: 'bachelors' },
  degrees: { pt: 'cursos', en: 'degrees' }
} as const satisfies Record<string, Record<Lang, string>>

/** /unis/ulisboa/faculdades, /en/unis/ulisboa/bachelors */
export function getUniversitySubpagePath(
  lang: Lang,
  uniSlug: string,
  page: keyof typeof UNIVERSITY_SUBPAGE_SEGMENT
): string {
  return `${getUniversityPath(lang, uniSlug)}/${UNIVERSITY_SUBPAGE_SEGMENT[page][lang]}`
}

/**
 * A university's degrees of one type: /unis/ulisboa/mestrados. Licenciaturas
 * are its `bachelors` sub-page; the segments are the faculty type pages' own.
 */
export function getUniversityTypePath(
  lang: Lang,
  uniSlug: string,
  type: FacultyTypePage
): string {
  return type === 'bachelor'
    ? getUniversitySubpagePath(lang, uniSlug, 'bachelors')
    : `${getUniversityPath(lang, uniSlug)}/${FACULTY_TYPE_SEGMENTS[type][lang]}`
}

/** The sub-page a /unis/:uniSlug/:segment URL names, in the other language */
function swapUniversitySubpage(
  uniSlug: string,
  segment: string,
  from: Lang
): string | null {
  const to: Lang = from === 'pt' ? 'en' : 'pt'
  const page = (
    Object.keys(UNIVERSITY_SUBPAGE_SEGMENT) as Array<
      keyof typeof UNIVERSITY_SUBPAGE_SEGMENT
    >
  ).find((key) => UNIVERSITY_SUBPAGE_SEGMENT[key][from] === segment)
  if (page) return getUniversitySubpagePath(to, uniSlug, page)
  const type = facultyTypeFromSegment(segment, from)
  return type ? getUniversityTypePath(to, uniSlug, type) : null
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
