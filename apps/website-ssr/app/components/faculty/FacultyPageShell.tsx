import { Home } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics, type FacultyPageKind } from '~/utils/analytics'
import { getFacultyPath, getLocalePath } from '~/utils/i18n-routes'
import { userPreferences } from '~/utils/userPreferences'
import {
  GenericBreadcrumb,
  type BreadcrumbItemData
} from '../common/GenericBreadcrumb'
import { ReportErrorNote } from '../common/ReportErrorNote'
import { DegreeTocBar, DegreeTocSidebar } from '../degree/DegreeToc'
import { useScrollSpy, type TocSection } from '../degree/scrollSpy'

/**
 * The frame shared by the faculty hub and its type pages, like the degree page
 * v2: breadcrumbs, a header of facts, then sections in one server-rendered page
 * with a table of contents on the side (a "Nesta página" bar and sheet on
 * phones). Owns the page's analytics: the view event, section reach and TOC
 * clicks, all tagged with `page`.
 */
export function FacultyPageShell({
  facultySlug,
  facultyShortName,
  page,
  crumb,
  title,
  subtitle,
  facts,
  actions,
  links,
  logo,
  sections,
  degreeCount,
  children
}: {
  facultySlug: string
  facultyShortName: string
  page: FacultyPageKind
  /** The last breadcrumb (a type page's label); none on the hub */
  crumb?: string
  title: string
  subtitle: ReactNode
  facts: ReactNode[]
  actions?: ReactNode
  /** The website and official profiles row (OfficialLinks), on the hub */
  links?: ReactNode
  /** The school's logo (SchoolLogo), on the hub */
  logo?: ReactNode
  sections: TocSection<string>[]
  degreeCount: number
  children: ReactNode
}) {
  const { t } = useTranslation()
  const lang = useLang()
  const sectionsRef = useRef(sections)
  sectionsRef.current = sections

  useEffect(() => {
    const ids = sectionsRef.current.map((s) => s.id)
    if (page === 'hub') {
      analytics.discovery.facultyPageViewed({ facultySlug, degreeCount })
    } else {
      analytics.faculty.typePageViewed({
        facultySlug,
        type: page,
        degreeCount,
        sections: ids
      })
    }
    userPreferences.set({
      lastSelectedFacultySlug: facultySlug,
      lastVisitedPath: window.location.pathname
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultySlug, page])

  const current = useScrollSpy<string>(
    sections,
    { facultySlug, degreeSlug: null },
    (section) => analytics.faculty.sectionViewed({ facultySlug, page, section })
  )
  const onToc = (surface: 'sidebar' | 'mobile_sheet') => (section: string) =>
    analytics.faculty.tocClicked({ facultySlug, page, section, surface })

  const browsePath = getLocalePath('browse', lang)
  const crumbs: BreadcrumbItemData[] = [
    {
      label: (
        <>
          <Home className="mr-1 h-3 w-3" />
          {t('breadcrumb.select_uni')}
        </>
      ),
      href: browsePath
    },
    {
      label: facultyShortName,
      href: crumb ? getFacultyPath(lang, facultySlug) : undefined,
      isActive: !crumb
    },
    ...(crumb ? [{ label: crumb, isActive: true }] : [])
  ]

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-4">
        <GenericBreadcrumb items={crumbs} />
      </div>

      <DegreeTocBar<string>
        sections={sections}
        current={current}
        onNavigate={onToc('mobile_sheet')}
        onOpen={() => analytics.faculty.tocOpened({ facultySlug, page })}
      />

      <div className="container mx-auto px-4 pb-16 pt-4 md:pt-6">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-12">
          <div className="min-w-0">
            <header className="mb-8">
              <div className="flex items-center gap-4">
                {logo}
                <div className="min-w-0">
                  <h1 className="text-balance text-2xl font-bold leading-tight text-foreground md:text-3xl">
                    {title}
                  </h1>
                  {links}
                </div>
              </div>
              <p className="mt-1 text-muted-foreground">{subtitle}</p>
              {facts.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {facts.map((fact, i) => (
                    <li
                      key={i}
                      className="whitespace-nowrap rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
              )}
              {actions && (
                <div className="mt-5 flex flex-wrap gap-2">{actions}</div>
              )}
            </header>

            {children}

            <div className="mt-12">
              <ReportErrorNote
                surface={page === 'hub' ? 'faculty_page' : 'faculty_type_page'}
                pageName={
                  crumb ? `${crumb} (${facultyShortName})` : facultyShortName
                }
                facultySlug={facultySlug}
              />
            </div>
          </div>

          <aside className="hidden lg:block">
            <DegreeTocSidebar<string>
              sections={sections}
              current={current}
              onNavigate={onToc('sidebar')}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
