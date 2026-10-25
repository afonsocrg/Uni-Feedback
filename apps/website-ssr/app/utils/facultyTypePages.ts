import type { DegreeType } from '@uni-feedback/db/schema'
import type { Lang } from '~/i18n/config'

/**
 * The degree types that get a page of their own under a faculty
 * (`/ist/licenciaturas`, `/en/ist/bachelors`, ...). `other` (IST's HACS) has
 * none: it is listed on the faculty hub only.
 */
export const FACULTY_TYPE_PAGES = [
  'bachelor',
  'integrated_master',
  'master',
  'minor',
  'postgraduate',
  'phd'
] as const satisfies readonly DegreeType[]

export type FacultyTypePage = (typeof FACULTY_TYPE_PAGES)[number]

/**
 * URL segment of each type page. Reserved: no degree slug may take one of
 * these, or its page would be shadowed (static segments win over
 * `:facultySlug/:degreeSlug`).
 */
export const FACULTY_TYPE_SEGMENTS: Record<
  FacultyTypePage,
  Record<Lang, string>
> = {
  bachelor: { pt: 'licenciaturas', en: 'bachelors' },
  integrated_master: { pt: 'mestrados-integrados', en: 'integrated-masters' },
  master: { pt: 'mestrados', en: 'masters' },
  minor: { pt: 'minors', en: 'minors' },
  postgraduate: { pt: 'pos-graduacoes', en: 'postgraduate' },
  phd: { pt: 'doutoramentos', en: 'phd' }
}

export function isFacultyTypePage(type: string): type is FacultyTypePage {
  return (FACULTY_TYPE_PAGES as readonly string[]).includes(type)
}

export function getFacultyTypePath(
  lang: Lang,
  facultySlug: string,
  type: FacultyTypePage
): string {
  const prefix = lang === 'en' ? '/en' : ''
  return `${prefix}/${facultySlug}/${FACULTY_TYPE_SEGMENTS[type][lang]}`
}

/** The type a URL segment names, in the given language. */
export function facultyTypeFromSegment(
  segment: string,
  lang: Lang
): FacultyTypePage | null {
  return (
    FACULTY_TYPE_PAGES.find(
      (type) => FACULTY_TYPE_SEGMENTS[type][lang] === segment
    ) ?? null
  )
}
