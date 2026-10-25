import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { getFacultyPath, getUniversityPath } from '~/utils/i18n-routes'
import { Breadcrumb } from '../common/Breadcrumb'
import { ERROR_REPORT_EMAIL } from '../common/ReportErrorNote'
import { SchoolLogo } from '../common/SchoolLogo'
import { formatInt } from '../degree/content'
import { TrackedLink } from './shared'
import type { UniversityListItem } from './types'

/** `/unis`: every university we cover, with its faculties. */
export function UniversitiesListContent({
  universities
}: {
  universities: UniversityListItem[]
}) {
  const { t } = useTranslation('university')
  const lang = useLang()

  useEffect(() => {
    analytics.university.universitiesPageViewed({
      universityCount: universities.length
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container mx-auto min-h-screen px-4 pb-16 pt-4">
      <div className="mx-auto max-w-3xl">
        <Breadcrumb surface="universities" className="mb-2" />
        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {t('list.title')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t('list.intro', { count: universities.length })}
        </p>
        <ul className="mt-6 space-y-3">
          {universities.map((u) => (
            <li
              key={u.id}
              className="flex gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primaryBlue"
            >
              <SchoolLogo logo={u.logo} name={u.name} shortName={u.shortName} />
              <div className="min-w-0">
                <TrackedLink
                  to={getUniversityPath(lang, u.slug)}
                  universitySlug={u.slug}
                  page="list"
                  target="university"
                  surface="list_title"
                  className="text-lg font-semibold text-foreground hover:underline"
                >
                  {u.name}
                </TrackedLink>
                <p className="text-sm text-muted-foreground">
                  {[
                    u.cities.slice(0, 2).join(', '),
                    t('list.faculty_count', {
                      count: u.faculties.length,
                      n: u.faculties.length
                    }),
                    t('list.degree_count', {
                      count: u.degreeCount,
                      n: formatInt(u.degreeCount, lang)
                    }),
                    u.feedbackCount > 0
                      ? t('list.feedback_count', {
                          count: u.feedbackCount,
                          n: formatInt(u.feedbackCount, lang)
                        })
                      : t('list.no_feedback')
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {u.faculties.map((f) => (
                    <TrackedLink
                      key={f.slug}
                      to={getFacultyPath(lang, f.slug)}
                      universitySlug={u.slug}
                      page="list"
                      target="faculty"
                      surface="list_faculty_chip"
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primaryBlue hover:underline"
                    >
                      {f.shortName}
                    </TrackedLink>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          {t('list.missing')}{' '}
          <a
            href={`mailto:${ERROR_REPORT_EMAIL}?subject=${encodeURIComponent(t('list.missing'))}`}
            onClick={() =>
              analytics.university.linkClicked({
                universitySlug: null,
                page: 'list',
                target: 'missing_university',
                surface: 'list_footer'
              })
            }
            className="underline underline-offset-2 hover:text-foreground"
          >
            {t('list.missing_link')}
          </a>
        </p>
      </div>
    </div>
  )
}
