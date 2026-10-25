import type { Lang } from '~/i18n/config'
import {
  getDegreePath,
  getFacultyPath,
  getLocalePath,
  getUniversityPath
} from './i18n-routes'

/**
 * The breadcrumb trail, shared by the visible `<Breadcrumb>` and the
 * `BreadcrumbList` JSON-LD so the two never disagree.
 *
 * It follows the hierarchy students think in (Universidades › ULisboa › IST ›
 * LEIC-A › ...), not the URL: faculty URLs leave the university out on purpose
 * (`/ist/leic-a`), and a breadcrumb only needs each crumb to link somewhere.
 * Visible labels are short (acronyms, short names) and the full name goes in
 * the tooltip and the JSON-LD, where Google shows it in results.
 */

export type CrumbLevel =
  | 'universities'
  | 'university'
  | 'faculty'
  | 'degree'
  | 'current'

export interface Crumb {
  level: CrumbLevel
  /** What the breadcrumb shows */
  label: string
  /** The tooltip and the JSON-LD name */
  fullName: string
  path?: string
}

export interface CrumbUniversity {
  slug: string
  /** In the page's language */
  name: string
  shortName: string
}

export interface CrumbTrail {
  university?: CrumbUniversity | null
  faculty?: { slug?: string | null; shortName: string; name?: string } | null
  degree?: { slug?: string | null; acronym: string; name?: string } | null
  /** The page's own crumb when it is not one of the above (a course, "Ingresso") */
  current?: string
  /** `current`'s full name, when it is an acronym */
  currentName?: string
}

/** `rootLabel` is `breadcrumb.universities` from the `common` namespace */
export function buildCrumbs(
  lang: Lang,
  rootLabel: string,
  { university, faculty, degree, current, currentName }: CrumbTrail
): Crumb[] {
  const crumbs: Crumb[] = [
    {
      level: 'universities',
      label: rootLabel,
      fullName: rootLabel,
      path: getLocalePath('universities', lang)
    }
  ]
  if (university) {
    crumbs.push({
      level: 'university',
      label: university.shortName,
      fullName: university.name,
      path: getUniversityPath(lang, university.slug)
    })
  }
  if (faculty) {
    crumbs.push({
      level: 'faculty',
      label: faculty.shortName,
      fullName: faculty.name ?? faculty.shortName,
      path: faculty.slug ? getFacultyPath(lang, faculty.slug) : undefined
    })
  }
  if (faculty && degree) {
    crumbs.push({
      level: 'degree',
      label: degree.acronym,
      fullName: degree.name ?? degree.acronym,
      path:
        faculty.slug && degree.slug
          ? getDegreePath(lang, faculty.slug, degree.slug)
          : undefined
    })
  }
  if (current) {
    crumbs.push({
      level: 'current',
      label: current,
      fullName: currentName ?? current
    })
  }
  return crumbs
}

/**
 * The same trail as schema.org `BreadcrumbList`, with full names. `pageUrl`
 * links the last crumb when it is the page's own (`current`) one.
 */
export function breadcrumbJsonLd(
  crumbs: Crumb[],
  origin: string,
  pageUrl?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => {
      const item = crumb.path
        ? `${origin}${crumb.path}`
        : i === crumbs.length - 1
          ? pageUrl
          : undefined
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.fullName,
        ...(item && { item })
      }
    })
  }
}
