import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import {
  getCoursePath,
  getDegreePath,
  getFacultyPath
} from '~/utils/i18n-routes'
import { Breadcrumb } from '../common/Breadcrumb'
import { ReportErrorNote } from '../common/ReportErrorNote'
import { SchoolLogo } from '../common/SchoolLogo'
import { formatGrade, formatInt, formatSchoolYear } from '../degree/content'
import { Stat } from '../degree/DegreeSections'
import {
  getTypePagePath,
  TrackedLink,
  TYPE_ORDER,
  useFeeText,
  useTypeCountLabel
} from './shared'
import type { UniversityPageData } from './types'

/**
 * `/unis/:uniSlug/faculdades`: one block per faculty (campuses, degrees by
 * type, admission, fees, most reviewed degree and course) and a comparison
 * table. Rough first version.
 */
export function UniversityFacultiesContent({
  data
}: {
  data: UniversityPageData
}) {
  const { t } = useTranslation(['university', 'browse'])
  const lang = useLang()
  const feeText = useFeeText()
  const typeCount = useTypeCountLabel()
  const { university, faculties } = data
  const slug = university.slug
  const year = data.admissionYear

  useEffect(() => {
    analytics.university.universityPageViewed({
      universitySlug: slug,
      page: 'faculties',
      facultyCount: faculties.length
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const link = (
    target: 'faculty' | 'faculty_type_page' | 'degree' | 'course',
    surface: string
  ) => ({
    universitySlug: slug,
    page: 'faculties' as const,
    target,
    surface
  })

  return (
    <div className="container mx-auto min-h-screen px-4 pb-16 pt-4">
      <div className="mx-auto max-w-4xl">
        <Breadcrumb
          surface="university_subpage"
          university={university}
          current={t('crumbs.faculties')}
          className="mb-2"
        />
        <h1 className="text-2xl font-bold leading-tight text-foreground text-balance md:text-3xl">
          {t('faculties_page.title', { name: university.name })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t('faculties_page.intro', {
            count: faculties.length,
            n: faculties.length,
            shortName: university.shortName
          })}
        </p>

        <div className="mt-6 space-y-4">
          {faculties.map((faculty) => {
            const feeLines = TYPE_ORDER.flatMap((type) =>
              (faculty.fees[type] ?? []).map(
                (range) =>
                  `${feeText(range)} (${t(`browse:degree_types.${type}`).toLowerCase()})`
              )
            )
            return (
              <section
                key={faculty.id}
                id={faculty.slug}
                className="scroll-mt-24 rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <SchoolLogo
                    logo={faculty.logo}
                    name={faculty.name}
                    shortName={faculty.shortName}
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">
                      <TrackedLink
                        to={getFacultyPath(lang, faculty.slug)}
                        {...link('faculty', 'faculty_title')}
                        className="text-foreground hover:underline"
                      >
                        {faculty.name}
                      </TrackedLink>
                    </h2>
                    {faculty.campuses.length > 0 && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {faculty.campuses
                          .map((c) =>
                            [
                              c.name,
                              c.address,
                              [c.postalCode, c.city].filter(Boolean).join(' ')
                            ]
                              .filter(Boolean)
                              .join(', ')
                          )
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat
                    value={formatInt(faculty.degreeCount, lang)}
                    label={t('faculties_page.degrees')}
                  />
                  {faculty.admissions && year && (
                    <>
                      <Stat
                        value={formatInt(faculty.admissions.vagas, lang)}
                        label={t('faculties_page.vagas', { year })}
                      />
                      <Stat
                        value={
                          faculty.admissions.minGrade ===
                          faculty.admissions.maxGrade
                            ? formatGrade(faculty.admissions.maxGrade, lang)
                            : `${formatGrade(faculty.admissions.minGrade, lang)}–${formatGrade(faculty.admissions.maxGrade, lang)}`
                        }
                        label={t('faculties_page.grades', { year })}
                      />
                    </>
                  )}
                  <Stat
                    value={formatInt(faculty.feedbackCount, lang)}
                    label={t('faculties_page.feedback')}
                  />
                </div>
                <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  {TYPE_ORDER.filter((type) => faculty.degreeCounts[type]).map(
                    (type) => {
                      const label = typeCount(type, faculty.degreeCounts[type]!)
                      const path = getTypePagePath(lang, faculty.slug, type)
                      return path ? (
                        <TrackedLink
                          key={type}
                          to={path}
                          {...link('faculty_type_page', 'faculty_types')}
                        >
                          {label}
                        </TrackedLink>
                      ) : (
                        <span key={type}>{label}</span>
                      )
                    }
                  )}
                </p>
                {feeLines.length > 0 && data.feesSchoolYear && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('faculties_page.fees', {
                      year: formatSchoolYear(data.feesSchoolYear),
                      fees: feeLines.join('; ')
                    })}
                  </p>
                )}
                {(faculty.topDegree || faculty.topCourse) && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {faculty.topDegree && (
                      <>
                        {t('faculties_page.top_degree')}{' '}
                        <TrackedLink
                          to={getDegreePath(
                            lang,
                            faculty.slug,
                            faculty.topDegree.slug
                          )}
                          {...link('degree', 'top_degree')}
                        >
                          {faculty.topDegree.name}
                        </TrackedLink>
                      </>
                    )}
                    {faculty.topDegree && faculty.topCourse && ' · '}
                    {faculty.topCourse && (
                      <>
                        {t('faculties_page.top_course')}{' '}
                        <TrackedLink
                          to={getCoursePath(lang, faculty.topCourse.id)}
                          {...link('course', 'top_course')}
                        >
                          {faculty.topCourse.name}
                        </TrackedLink>{' '}
                        ({formatInt(faculty.topCourse.feedbackCount, lang)})
                      </>
                    )}
                  </p>
                )}
              </section>
            )
          })}
        </div>

        {faculties.length > 1 && (
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              {t('faculties_page.compare')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-1.5 pr-2 font-medium">
                      {t('faculties_page.col_faculty')}
                    </th>
                    <th className="py-1.5 pr-2 text-right font-medium">
                      {t('faculties_page.col_degrees')}
                    </th>
                    <th className="py-1.5 pr-2 text-right font-medium">
                      {t('faculties_page.col_bachelors')}
                    </th>
                    {year && (
                      <th className="py-1.5 pr-2 text-right font-medium">
                        {t('faculties_page.col_vagas', { year })}
                      </th>
                    )}
                    <th className="py-1.5 text-right font-medium">
                      {t('faculties_page.col_feedback')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {faculties.map((faculty) => (
                    <tr key={faculty.id} className="border-b border-border">
                      <td className="py-2 pr-2">
                        <a
                          href={`#${faculty.slug}`}
                          className="text-primaryBlue hover:underline"
                        >
                          {faculty.shortName}
                        </a>
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {faculty.degreeCount}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {(faculty.degreeCounts.bachelor ?? 0) +
                          (faculty.degreeCounts.integrated_master ?? 0)}
                      </td>
                      {year && (
                        <td className="py-2 pr-2 text-right tabular-nums">
                          {faculty.admissions
                            ? formatInt(faculty.admissions.vagas, lang)
                            : '–'}
                        </td>
                      )}
                      <td className="py-2 text-right tabular-nums">
                        {formatInt(faculty.feedbackCount, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {year && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t('faculties_page.source', { year })}
              </p>
            )}
          </section>
        )}

        <div className="mt-12">
          <ReportErrorNote
            surface="university_page"
            pageName={`${university.shortName}: ${t('crumbs.faculties')}`}
          />
        </div>
      </div>
    </div>
  )
}
