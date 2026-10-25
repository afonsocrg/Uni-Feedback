import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { type ErrorReportSurface } from '~/utils/analytics'
import type { CrumbUniversity } from '~/utils/breadcrumbs'
import { getDegreePath } from '~/utils/i18n-routes'
import { Breadcrumb } from '../common/Breadcrumb'
import { PageHeading } from '../common/PageHeading'
import { ReportErrorNote } from '../common/ReportErrorNote'
import { DegreeTocBar, DegreeTocSidebar } from './DegreeToc'
import { useScrollSpy, type TocSection } from './scrollSpy'

/**
 * The frame of a degree sub-page (`/ingresso`, `/saidas-profissionais`):
 * breadcrumb, an H1 for the page's query with a link back to the degree page,
 * then the sections with the same table of contents as the degree page (sidebar
 * on desktop, "Nesta página" sheet on phones).
 *
 * No tabs across the degree's pages (tried 2026-10-23): tabs read as views of
 * one page, and these are separate pages. The degree page is the hub; each of
 * its sections links to the page that goes deeper.
 */
export function DegreeSubpageShell({
  faculty,
  degree,
  university,
  universityName,
  crumb,
  title,
  sections,
  reportSurface,
  children
}: {
  faculty: Faculty
  degree: Degree
  university: CrumbUniversity | null
  universityName: string | null
  /** The breadcrumb's last item ("Ingresso") */
  crumb: string
  title: string
  sections: TocSection<string>[]
  reportSurface: ErrorReportSurface
  children: ReactNode
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const track = { facultySlug: faculty.slug, degreeSlug: degree.slug }
  // Section views are not tracked here (the page view says what rendered)
  const current = useScrollSpy(sections, track, () => {})

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumb
          surface="degree_subpage"
          university={university}
          faculty={faculty}
          degree={degree}
          current={crumb}
        />
      </div>

      <DegreeTocBar
        sections={sections}
        current={current}
        onNavigate={() => {}}
        onOpen={() => {}}
      />

      <div className="container mx-auto px-4 pb-16 pt-4 md:pt-6">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-12">
          <div className="min-w-0">
            <header className="mb-6">
              <PageHeading
                school={faculty}
                eyebrow={
                  universityName
                    ? `${faculty.name} · ${universityName}`
                    : faculty.name
                }
                title={title}
              >
                {faculty.slug && degree.slug && (
                  <Link
                    to={getDegreePath(lang, faculty.slug, degree.slug)}
                    className="mt-1 inline-flex items-center gap-1 text-sm text-primaryBlue hover:underline"
                  >
                    <ArrowLeft aria-hidden="true" className="size-3.5" />
                    {t('degree_subpages.back', { acronym: degree.acronym })}
                  </Link>
                )}
              </PageHeading>
            </header>

            {children}

            {faculty.slug && degree.slug && (
              <Link
                to={getDegreePath(lang, faculty.slug, degree.slug)}
                className="mt-10 inline-flex items-center gap-1.5 font-semibold text-primaryBlue hover:underline"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                {t('degree_subpages.back', { acronym: degree.acronym })}
              </Link>
            )}

            <div className="mt-12">
              <ReportErrorNote
                surface={reportSurface}
                pageName={`${degree.acronym} (${faculty.shortName}), ${crumb}`}
                facultySlug={faculty.slug}
                degreeSlug={degree.slug}
              />
            </div>
          </div>

          <aside className="hidden lg:block">
            <DegreeTocSidebar
              sections={sections}
              current={current}
              onNavigate={() => {}}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
