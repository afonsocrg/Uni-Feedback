import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { isValidElement, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import type { CrumbUniversity } from '~/utils/breadcrumbs'
import { getDegreePath } from '~/utils/i18n-routes'
import { ContributeNote } from '../common/ContributeNote'
import { formatInt, formatNumber, formatPct, type FaqItem } from './content'
import {
  FaqSection,
  SectionShell,
  SourceLink,
  Stat,
  StatGrid,
  SubHeading,
  useOutcomeStats,
  type DegreeTrack
} from './DegreeSections'
import { DegreeSubpageShell } from './DegreeSubpageShell'
import type { DegreeCareersPageData, DegreePageExtras } from './pageTypes'

/**
 * `/:faculty/:degree/saidas-profissionais` (EN `/careers`): what happens after
 * the degree, as far as public data goes. InfoCursos counts graduates
 * registered as unemployed at the IEFP: we show its complement as
 * "Empregabilidade" with what it measures, and never say graduates "found a
 * job". Careers proper (salaries, employers) wait for data we don't have
 * (prds/career_outcomes.md), with a prompt in their place.
 */
export function DegreeCareersPage({
  faculty,
  degree,
  university,
  extras,
  data,
  hasAbout,
  faq
}: {
  faculty: Faculty
  degree: Degree
  university: CrumbUniversity | null
  extras: DegreePageExtras
  data: DegreeCareersPageData
  /** The degree page has our reviewed description (it covers careers) */
  hasAbout: boolean
  faq: FaqItem[]
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const track: DegreeTrack = {
    facultySlug: faculty.slug,
    degreeSlug: degree.slug,
    pageName: `${degree.acronym} (${faculty.shortName})`
  }
  const { acronym } = degree
  const outcomes = extras.outcomes
  // Only employability up top: completion and "still in the course" are in
  // "Durante o curso", with more detail
  const headline = useOutcomeStats(outcomes).filter(
    (stat) => isValidElement(stat) && stat.key === 'unemployment'
  )
  const latestWindow = data.unemploymentHistory[0]
  const during = useDuringStats(data)
  const continuesTo = extras.related.filter(
    (r) => r.relationship === 'continues_to'
  )
  const continuesFrom = extras.related.filter(
    (r) => r.relationship === 'continues_from'
  )
  const hasData = outcomes !== null || during.length > 0

  const sections = [
    {
      id: 'empregabilidade',
      label: t('degree_subpages.careers.sections.employability')
    },
    ...(data.unemploymentHistory.length > 1
      ? [
          {
            id: 'historico',
            label: t('degree_subpages.careers.sections.history')
          }
        ]
      : []),
    { id: 'carreiras', label: t('degree_subpages.careers.sections.jobs') },
    ...(continuesTo.length > 0 || continuesFrom.length > 0
      ? [
          {
            id: 'percursos',
            label: t('degree_subpages.careers.sections.paths')
          }
        ]
      : []),
    ...(during.length > 0
      ? [{ id: 'durante', label: t('degree_subpages.careers.sections.during') }]
      : []),
    ...(faq.length > 0
      ? [{ id: 'faq', label: t('degree_page.sections.faq') }]
      : [])
  ]

  useEffect(() => {
    if (!faculty.slug || !degree.slug) return
    analytics.discovery.degreeSubpageViewed({
      facultySlug: faculty.slug,
      degreeSlug: degree.slug,
      page: 'careers',
      hasData
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faculty.slug, degree.slug])

  const infocursosSource = data.infocursos && (
    <p className="mt-4 text-xs text-muted-foreground">
      {t('degree_page.source_label')}{' '}
      <SourceLink href={data.infocursos.url} source="infocursos" track={track}>
        {t('degree_page.outcomes.source', { edition: data.infocursos.edition })}
      </SourceLink>
    </p>
  )

  return (
    <DegreeSubpageShell
      faculty={faculty}
      degree={degree}
      university={university}
      universityName={extras.universityName}
      crumb={t('degree_subpages.tabs.careers')}
      title={t('degree_subpages.careers.h1', { name: degree.name })}
      sections={sections}
      reportSurface="degree_careers_page"
    >
      <SectionShell
        id="empregabilidade"
        title={t('degree_subpages.careers.sections.employability')}
        first
      >
        {headline.length > 0 ? (
          <>
            <StatGrid>{headline}</StatGrid>
            {outcomes?.unemployment && (
              <p className="mt-4 max-w-prose text-sm">
                {latestWindow?.graduates != null &&
                latestWindow.unemployed != null &&
                latestWindow.from &&
                latestWindow.to
                  ? t('degree_subpages.careers.explainer', {
                      graduates: formatInt(latestWindow.graduates, lang),
                      unemployed: formatNumber(latestWindow.unemployed, lang),
                      from: latestWindow.from,
                      to: latestWindow.to,
                      rate: formatPct(outcomes.unemployment.rate, lang)
                    })
                  : t('degree_subpages.careers.explainer_short', {
                      rate: formatPct(outcomes.unemployment.rate, lang)
                    })}
              </p>
            )}
            {outcomes?.broaderProgramme && (
              <p className="mt-3 text-sm text-muted-foreground">
                {t(
                  `degree_page.outcomes.broader.${
                    outcomes.broaderProgramme.level === 'mestrado' ||
                    outcomes.broaderProgramme.level === 'licenciatura'
                      ? outcomes.broaderProgramme.level
                      : 'other'
                  }`,
                  { name: outcomes.broaderProgramme.name }
                )}
              </p>
            )}
            {infocursosSource}
          </>
        ) : (
          <ContributeNote
            field="outcomes"
            text={t('degree_page.outcomes.missing')}
            pageName={track.pageName}
            facultySlug={track.facultySlug}
            degreeSlug={track.degreeSlug}
          />
        )}
      </SectionShell>

      {data.unemploymentHistory.length > 1 && (
        <SectionShell
          id="historico"
          title={t('degree_subpages.careers.sections.history')}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm tabular-nums">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">
                    {t('degree_subpages.careers.history.window')}
                  </th>
                  <th className="py-1.5 pr-3 font-medium">
                    {t('degree_subpages.careers.history.graduates')}
                  </th>
                  <th className="py-1.5 pr-3 font-medium">
                    {t('degree_subpages.careers.history.unemployed')}
                  </th>
                  <th className="py-1.5 font-medium">
                    {t('degree_page.outcomes.employability')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.unemploymentHistory.map((w) => (
                  <tr key={w.edition} className="border-b border-border">
                    <td className="py-1.5 pr-3">
                      {w.from && w.to
                        ? t('degree_subpages.careers.history.window_value', {
                            from: w.from,
                            to: w.to
                          })
                        : t('degree_subpages.careers.history.edition', {
                            edition: w.edition
                          })}
                    </td>
                    <td className="py-1.5 pr-3">
                      {w.graduates != null ? formatInt(w.graduates, lang) : ''}
                    </td>
                    <td className="py-1.5 pr-3">
                      {w.unemployed != null
                        ? formatNumber(w.unemployed, lang)
                        : ''}
                    </td>
                    <td className="py-1.5 font-semibold">
                      {formatPct(Math.round((100 - w.rate) * 10) / 10, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('degree_subpages.careers.history.note')}
          </p>
          {infocursosSource}
        </SectionShell>
      )}

      <SectionShell
        id="carreiras"
        title={t('degree_subpages.careers.sections.jobs')}
      >
        {hasAbout && faculty.slug && degree.slug && (
          <p className="mb-3 text-sm">
            {t('degree_subpages.careers.about_hint')}{' '}
            <Link
              to={`${getDegreePath(lang, faculty.slug, degree.slug)}#sobre`}
              className="font-semibold text-primaryBlue hover:underline"
            >
              {t('degree_subpages.careers.about_link')}
            </Link>
          </p>
        )}
        <ContributeNote
          field="careers"
          text={t('degree_subpages.careers.jobs_missing')}
          pageName={track.pageName}
          facultySlug={track.facultySlug}
          degreeSlug={track.degreeSlug}
        />
      </SectionShell>

      {(continuesTo.length > 0 || continuesFrom.length > 0) && (
        <SectionShell
          id="percursos"
          title={t('degree_subpages.careers.sections.paths')}
        >
          <PathList
            title={t('degree_subpages.careers.paths_to', { acronym })}
            degrees={continuesTo}
          />
          <PathList
            title={t('degree_subpages.careers.paths_from', { acronym })}
            degrees={continuesFrom}
          />
        </SectionShell>
      )}

      {during.length > 0 && (
        <SectionShell
          id="durante"
          title={t('degree_subpages.careers.sections.during')}
        >
          <StatGrid>{during}</StatGrid>
          {data.finalGrades && data.finalGrades.distribution.length > 0 && (
            <GradeDistribution grades={data.finalGrades} />
          )}
          {infocursosSource}
        </SectionShell>
      )}

      {faq.length > 0 && (
        <FaqSection
          items={faq}
          surface="degree_careers_page"
          chatScope={{ degreeId: degree.id, scopeLabel: degree.acronym }}
        />
      )}
    </DegreeSubpageShell>
  )
}

function useDuringStats(data: DegreeCareersPageData): ReactNode[] {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const stats: ReactNode[] = []
  const c = data.completion
  if (c?.expectedTime != null) {
    const extra = [
      c.plus1Year != null
        ? t('degree_subpages.careers.during.plus1', {
            pct: formatPct(c.plus1Year, lang)
          })
        : null,
      c.plus3Years != null
        ? t('degree_subpages.careers.during.plus3', {
            pct: formatPct(c.plus3Years, lang)
          })
        : null
    ].filter(Boolean)
    stats.push(
      <Stat
        key="completion"
        value={formatPct(c.expectedTime, lang)}
        label={t('degree_page.outcomes.completion')}
        note={[
          extra.join(' · '),
          c.cohortYear
            ? t('degree_subpages.careers.during.cohort', {
                year: c.cohortYear,
                n:
                  c.firstYearStudents != null
                    ? formatInt(c.firstYearStudents, lang)
                    : '?'
              })
            : null
        ]
          .filter(Boolean)
          .join('. ')}
      />
    )
  }
  const s = data.statusAfter1Year
  if (s?.sameCourse != null) {
    stats.push(
      <Stat
        key="still"
        value={formatPct(s.sameCourse, lang)}
        label={t('degree_page.outcomes.still_in_course')}
        note={
          s.otherCourseSameInstitution != null && s.otherInstitution != null
            ? t('degree_subpages.careers.during.moved', {
                same: formatPct(s.otherCourseSameInstitution, lang),
                other: formatPct(s.otherInstitution, lang)
              })
            : null
        }
      />
    )
  }
  const g = data.finalGrades
  if (g?.average != null) {
    stats.push(
      <Stat
        key="grade"
        value={formatNumber(g.average, lang)}
        label={t('degree_subpages.careers.during.final_grade')}
        note={
          g.graduates != null && g.schoolYears.length > 0
            ? t('degree_subpages.careers.during.graduates', {
                n: formatInt(g.graduates, lang),
                years: g.schoolYears.join(t('degree_subpages.and'))
              })
            : null
        }
      />
    )
  }
  return stats
}

function GradeDistribution({
  grades
}: {
  grades: NonNullable<DegreeCareersPageData['finalGrades']>
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const max = Math.max(...grades.distribution.map((d) => d.percent), 1)
  return (
    <>
      <SubHeading>
        {t('degree_subpages.careers.during.grades_title')}
      </SubHeading>
      <div
        role="img"
        aria-label={t('degree_subpages.careers.during.grades_label')}
        className="flex h-32 items-end gap-1"
      >
        {grades.distribution.map((d) => (
          <div
            key={d.grade}
            className="flex-1 rounded-t bg-brand-solid"
            style={{ height: `${(d.percent / max) * 100}%` }}
            title={t('degree_subpages.careers.during.grade_bar', {
              grade: d.grade,
              pct: formatPct(d.percent, lang)
            })}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-center text-xs text-muted-foreground">
        {grades.distribution.map((d) => (
          <span key={d.grade} className="flex-1">
            {d.grade}
          </span>
        ))}
      </div>
    </>
  )
}

function PathList({
  title,
  degrees
}: {
  title: string
  degrees: DegreePageExtras['related']
}) {
  const lang = useLang()
  if (degrees.length === 0) return null
  return (
    <div className="mb-4">
      <SubHeading>{title}</SubHeading>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {degrees.map((r) => (
          <li key={`${r.facultySlug}-${r.slug}`}>
            <Link
              to={getDegreePath(lang, r.facultySlug, r.slug)}
              className="block h-full rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:border-primaryBlue"
            >
              <b className="block">
                {r.acronym} · {r.facultyShortName}
              </b>
              <span className="block text-sm text-muted-foreground">
                {r.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
