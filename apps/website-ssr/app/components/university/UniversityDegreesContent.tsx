import type { DegreeType } from '@uni-feedback/db/schema'
import { cn } from '@uni-feedback/ui'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import {
  isFacultyTypePage,
  type FacultyTypePage
} from '~/utils/facultyTypePages'
import {
  getDegreePath,
  getUniversitySubpagePath,
  getUniversityTypePath
} from '~/utils/i18n-routes'
import { Breadcrumb } from '../common/Breadcrumb'
import { ReportErrorNote } from '../common/ReportErrorNote'
import { formatInt, formatNumber } from '../degree/content'
import { TrackedLink, TYPE_ORDER } from './shared'
import type { UniversityDegree, UniversityPageData } from './types'

/**
 * `/unis/:uniSlug/cursos` (every degree, one table per type) and the type
 * pages across faculties (`/unis/:uniSlug/mestrados`, ...), filterable by
 * faculty. Answers "mestrados ulisboa" style searches; licenciaturas have their
 * own page with the 1ª fase grades. Rough first version.
 */
export function UniversityDegreesContent({
  data,
  type
}: {
  data: UniversityPageData
  /** The type shown; null on `/cursos` */
  type: Exclude<FacultyTypePage, 'bachelor'> | null
}) {
  const { t } = useTranslation(['university', 'browse'])
  const lang = useLang()
  const { university } = data
  const slug = university.slug
  const [facultySlug, setFacultySlug] = useState<string | null>(null)

  const ofType = type
    ? data.degrees.filter((d) => d.type === type)
    : data.degrees
  const typeLabel = type ? t(`browse:degree_types.${type}`) : null
  const crumb = typeLabel ?? t('crumbs.degrees')

  useEffect(() => {
    setFacultySlug(null)
    analytics.university.universityPageViewed({
      universitySlug: slug,
      page: 'degrees',
      facultyCount: data.faculties.length,
      degreeType: type,
      degreeCount: ofType.length
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, type])

  const facultiesWithDegrees = data.faculties.filter((f) =>
    ofType.some((d) => d.facultySlug === f.slug)
  )
  const rows = facultySlug
    ? ofType.filter((d) => d.facultySlug === facultySlug)
    : ofType
  const groups = type
    ? [{ type: type as DegreeType, degrees: rows }]
    : TYPE_ORDER.map((groupType) => ({
        type: groupType,
        degrees: rows.filter((d) => d.type === groupType)
      })).filter((g) => g.degrees.length > 0)

  const select = (value: string | null) => {
    setFacultySlug(value)
    analytics.university.degreesFilterSelected({
      universitySlug: slug,
      degreeType: type,
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
        <Breadcrumb
          surface="university_subpage"
          university={university}
          current={crumb}
          className="mb-2"
        />
        <h1 className="text-2xl font-bold leading-tight text-foreground text-balance md:text-3xl">
          {t('degrees_page.title', { name: university.name, type: crumb })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {typeLabel
            ? t('degrees_page.intro_type', {
                count: ofType.length,
                n: formatInt(ofType.length, lang),
                type: typeLabel.toLowerCase()
              })
            : t('degrees_page.intro', {
                count: ofType.length,
                n: formatInt(ofType.length, lang)
              })}
        </p>

        {facultiesWithDegrees.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {chip(null, t('degrees_page.all'))}
            {facultiesWithDegrees.map((f) => chip(f.slug, f.shortName))}
          </div>
        )}

        {groups.map((group) => (
          <section key={group.type} className="mt-6">
            {!type && (
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                {isFacultyTypePage(group.type) ? (
                  <TrackedLink
                    to={getUniversityTypePath(lang, slug, group.type)}
                    universitySlug={slug}
                    page="degrees"
                    target={
                      group.type === 'bachelor'
                        ? 'bachelors_page'
                        : 'university_type_page'
                    }
                    surface="degrees_group_title"
                    className="text-foreground hover:underline"
                  >
                    {t(`browse:degree_types.${group.type}`)}
                  </TrackedLink>
                ) : (
                  t(`browse:degree_types.${group.type}`)
                )}{' '}
                <span className="font-normal text-muted-foreground">
                  ({formatInt(group.degrees.length, lang)})
                </span>
              </h2>
            )}
            <DegreeTable degrees={group.degrees} universitySlug={slug} />
          </section>
        ))}

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
          {type && (
            <TrackedLink
              to={getUniversitySubpagePath(lang, slug, 'degrees')}
              universitySlug={slug}
              page="degrees"
              target="degrees_page"
              surface="degrees_footer"
              className="inline-flex items-center gap-1.5 font-semibold text-primaryBlue hover:underline"
            >
              {t('degrees_page.see_all', {
                count: data.degrees.length,
                n: formatInt(data.degrees.length, lang)
              })}
              <ArrowRight aria-hidden="true" className="size-4" />
            </TrackedLink>
          )}
          <TrackedLink
            to={getUniversitySubpagePath(lang, slug, 'faculties')}
            universitySlug={slug}
            page="degrees"
            target="faculties_page"
            surface="degrees_footer"
            className="inline-flex items-center gap-1.5 font-semibold text-primaryBlue hover:underline"
          >
            {t('degrees_page.see_faculties', {
              shortName: university.shortName
            })}
            <ArrowRight aria-hidden="true" className="size-4" />
          </TrackedLink>
        </div>

        <div className="mt-12">
          <ReportErrorNote
            surface="university_page"
            pageName={`${university.shortName}: ${crumb}`}
          />
        </div>
      </div>
    </div>
  )
}

function DegreeTable({
  degrees,
  universitySlug
}: {
  degrees: UniversityDegree[]
  universitySlug: string
}) {
  const { t } = useTranslation(['university', 'browse'])
  const lang = useLang()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-1.5 pr-2 font-medium">
              {t('bachelors_page.col_degree')}
            </th>
            <th className="py-1.5 pr-2 text-right font-medium">
              {t('bachelors_page.col_duration')}
            </th>
            <th className="py-1.5 text-right font-medium">
              {t('degrees_page.col_feedback')}
            </th>
          </tr>
        </thead>
        <tbody>
          {degrees.map((d) => (
            <tr
              key={`${d.facultySlug}/${d.slug}`}
              className="border-b border-border"
            >
              <td className="py-2 pr-2">
                <TrackedLink
                  to={getDegreePath(lang, d.facultySlug, d.slug)}
                  universitySlug={universitySlug}
                  page="degrees"
                  target="degree"
                  surface="degrees_table"
                >
                  {d.name}
                </TrackedLink>
                <span className="block text-xs text-muted-foreground">
                  {d.facultyShortName} · {d.acronym}
                </span>
              </td>
              <td className="py-2 pr-2 text-right tabular-nums">
                {d.durationSemesters
                  ? t('bachelors_page.years', {
                      count: d.durationSemesters / 2,
                      n: formatNumber(d.durationSemesters / 2, lang)
                    })
                  : '–'}
                {d.ects && (
                  <span className="block text-xs text-muted-foreground">
                    {formatNumber(d.ects, lang)} ECTS
                  </span>
                )}
              </td>
              <td className="py-2 text-right tabular-nums">
                {d.feedbackCount > 0 ? formatInt(d.feedbackCount, lang) : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
