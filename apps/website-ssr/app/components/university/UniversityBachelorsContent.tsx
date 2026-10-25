import { cn } from '@uni-feedback/ui'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { getDegreePath } from '~/utils/i18n-routes'
import { ContributeNote } from '../common/ContributeNote'
import { ReportErrorNote } from '../common/ReportErrorNote'
import { formatGrade, formatNumber } from '../degree/content'
import { TrackedLink, UniversityCrumbs } from './shared'
import type { UniversityPageData } from './types'

/**
 * `/unis/:uniSlug/licenciaturas`: every licenciatura and mestrado integrado we
 * list at the university, with the 1ª fase last-placed grade and vagas, best
 * grade first, filterable by faculty. Answers "licenciaturas ulisboa" style
 * searches. Rough first version.
 */
export function UniversityBachelorsContent({
  data
}: {
  data: UniversityPageData
}) {
  const { t } = useTranslation(['university', 'browse'])
  const lang = useLang()
  const { university } = data
  const slug = university.slug
  const year = data.admissionYear
  const [facultySlug, setFacultySlug] = useState<string | null>(null)

  useEffect(() => {
    analytics.university.universityPageViewed({
      universitySlug: slug,
      page: 'bachelors',
      facultyCount: data.faculties.length
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const facultiesWithBachelors = data.faculties.filter((f) =>
    data.bachelors.some((b) => b.facultySlug === f.slug)
  )
  const rows = facultySlug
    ? data.bachelors.filter((b) => b.facultySlug === facultySlug)
    : data.bachelors

  const select = (value: string | null) => {
    setFacultySlug(value)
    analytics.university.bachelorsFilterSelected({
      universitySlug: slug,
      facultySlug: value
    })
  }

  const chip = (value: string | null, label: string) => (
    <button
      key={value ?? 'all'}
      type="button"
      aria-pressed={facultySlug === value}
      onClick={() => select(value)}
      className={cn(
        'rounded-full border px-3 py-1 text-sm',
        facultySlug === value
          ? 'border-brand-solid bg-brand-solid text-white'
          : 'border-border bg-card text-foreground hover:bg-muted'
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="container mx-auto min-h-screen px-4 pb-16 pt-4">
      <div className="mx-auto max-w-4xl">
        <UniversityCrumbs
          university={university}
          current={t('crumbs.bachelors')}
        />
        <h1 className="text-2xl font-bold leading-tight text-foreground text-balance md:text-3xl">
          {t('bachelors_page.title', { name: university.name })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {year
            ? t('bachelors_page.intro', {
                shortName: university.shortName,
                year
              })
            : t('bachelors_page.intro_no_year', {
                shortName: university.shortName
              })}
        </p>

        {facultiesWithBachelors.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {chip(null, t('bachelors_page.all'))}
            {facultiesWithBachelors.map((f) => chip(f.slug, f.shortName))}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-1.5 pr-2 font-medium">
                  {t('bachelors_page.col_degree')}
                </th>
                <th className="py-1.5 pr-2 text-right font-medium">
                  {t('bachelors_page.col_duration')}
                </th>
                {year && (
                  <>
                    <th className="py-1.5 pr-2 text-right font-medium">
                      {t('bachelors_page.col_grade', { year })}
                    </th>
                    <th className="py-1.5 text-right font-medium">
                      {t('bachelors_page.col_vagas')}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const delta =
                  b.grade !== null && b.previousGrade !== null
                    ? b.grade - b.previousGrade
                    : null
                return (
                  <tr
                    key={`${b.facultySlug}/${b.slug}`}
                    className="border-b border-border"
                  >
                    <td className="py-2 pr-2">
                      <TrackedLink
                        to={getDegreePath(lang, b.facultySlug, b.slug)}
                        universitySlug={slug}
                        page="bachelors"
                        target="degree"
                        surface="bachelors_table"
                      >
                        {b.name}
                      </TrackedLink>
                      <span className="block text-xs text-muted-foreground">
                        {b.facultyShortName} · {b.acronym}
                        {b.type === 'integrated_master' &&
                          ` · ${t('browse:degree_page.facts.type.integrated_master')}`}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {b.durationSemesters
                        ? t('bachelors_page.years', {
                            count: b.durationSemesters / 2,
                            n: formatNumber(b.durationSemesters / 2, lang)
                          })
                        : '–'}
                      {b.ects && (
                        <span className="block text-xs text-muted-foreground">
                          {formatNumber(b.ects, lang)} ECTS
                        </span>
                      )}
                    </td>
                    {year && (
                      <>
                        <td className="py-2 pr-2 text-right tabular-nums">
                          {b.grade !== null ? formatGrade(b.grade, lang) : '–'}
                          {delta !== null && (
                            <span className="block text-xs text-muted-foreground">
                              {t('bachelors_page.delta', {
                                delta: `${delta >= 0 ? '+' : '−'}${formatGrade(Math.abs(delta), lang)}`,
                                year: year - 1
                              })}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {b.vagas ?? '–'}
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {year && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t('bachelors_page.source', { year, previous: year - 1 })}
          </p>
        )}
        {data.bachelors.some((b) => b.grade === null) && (
          <ContributeNote
            field="admission"
            className="mt-2"
            text={t('bachelors_page.missing_admission')}
            pageName={`${university.shortName}: ${t('crumbs.bachelors')}`}
          />
        )}

        <div className="mt-12">
          <ReportErrorNote
            surface="university_page"
            pageName={`${university.shortName}: ${t('crumbs.bachelors')}`}
          />
        </div>
      </div>
    </div>
  )
}
