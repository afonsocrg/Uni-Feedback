import { ChevronRight, Home } from 'lucide-react'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { userPreferences } from '~/utils'
import { analytics, type BreadcrumbSurface } from '~/utils/analytics'
import { buildCrumbs, type Crumb, type CrumbTrail } from '~/utils/breadcrumbs'
import { getDegreeCoursesPath, getFacultyPath } from '~/utils/i18n-routes'

interface BreadcrumbProps extends CrumbTrail {
  /** The page it sits on, for analytics */
  surface: BreadcrumbSurface
  className?: string
}

/**
 * Universidades › ULisboa › IST › LEIC-A › Cadeiras. The trail comes from
 * `buildCrumbs`, the same one the pages' JSON-LD uses. On phones only the root
 * (as an icon) and the last two crumbs show, with "…" for the levels between.
 */
export function Breadcrumb({
  surface,
  className = '',
  ...trail
}: BreadcrumbProps) {
  const { t } = useTranslation()
  const lang = useLang()
  const crumbs = buildCrumbs(lang, t('breadcrumb.universities'), trail)
  const { faculty, degree } = trail

  // Remember where the student is going, as the browse shortcuts expect
  const remember = (crumb: Crumb) => {
    if (crumb.level === 'universities' || crumb.level === 'university') {
      userPreferences.set({
        lastSelectedFacultySlug: undefined,
        lastSelectedDegreeSlug: undefined
      })
    } else if (crumb.level === 'faculty' && faculty?.slug) {
      userPreferences.set({
        lastSelectedFacultySlug: faculty.slug,
        lastSelectedDegreeSlug: undefined,
        lastVisitedPath: getFacultyPath(lang, faculty.slug)
      })
    } else if (crumb.level === 'degree' && faculty?.slug && degree?.slug) {
      userPreferences.set({
        lastSelectedFacultySlug: faculty.slug,
        lastSelectedDegreeSlug: degree.slug,
        // A returning student comes back to the degree's course browser
        lastVisitedPath: getDegreeCoursesPath(lang, faculty.slug, degree.slug)
      })
    }
  }

  const last = crumbs.length - 1
  // Hidden on phones: everything between the root and the last two
  const isCollapsed = (i: number) => i > 0 && i < last - 1

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-xs text-muted-foreground ${className}`}
    >
      <ol className="flex min-w-0 items-center">
        {crumbs.map((crumb, i) => {
          const isLast = i === last
          const isRoot = i === 0
          const title =
            crumb.fullName !== crumb.label ? crumb.fullName : undefined
          const content = (
            <>
              {isRoot && (
                <Home aria-hidden="true" className="h-3 w-3 sm:mr-1" />
              )}
              <span className={isRoot ? 'sr-only sm:not-sr-only' : 'truncate'}>
                {crumb.label}
              </span>
            </>
          )
          return (
            <Fragment key={crumb.level}>
              {i === 1 && last > 2 && (
                <li aria-hidden="true" className="flex items-center sm:hidden">
                  <ChevronRight className="mx-1 h-3 w-3" />…
                </li>
              )}
              <li
                className={`min-w-0 items-center ${isCollapsed(i) ? 'hidden sm:flex' : 'flex'} ${isLast ? 'shrink' : 'shrink-0'}`}
              >
                {i > 0 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="mx-1 h-3 w-3 shrink-0"
                  />
                )}
                {isLast || !crumb.path ? (
                  <span
                    title={title}
                    aria-current={isLast ? 'page' : undefined}
                    className={`flex min-w-0 max-w-[16rem] items-center ${isLast ? 'font-medium' : ''}`}
                  >
                    {content}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    title={title}
                    onClick={() => {
                      remember(crumb)
                      analytics.navigation.breadcrumbClicked({
                        level: crumb.level as Exclude<
                          Crumb['level'],
                          'current'
                        >,
                        surface,
                        levelsUp: last - i
                      })
                    }}
                    className="flex min-w-0 max-w-[16rem] items-center transition-colors hover:text-foreground hover:underline"
                  >
                    {content}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
