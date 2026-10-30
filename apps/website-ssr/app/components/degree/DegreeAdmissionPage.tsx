import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import type { CrumbUniversity } from '~/utils/breadcrumbs'
import { ContributeNote } from '../common/ContributeNote'
import { AdmissionApply } from './AdmissionApply'
import { AdmissionChart } from './AdmissionChart'
import { AdmissionSummary, TuitionStat } from './AdmissionSummary'
import {
  formatEur,
  formatGrade,
  formatInt,
  formatSchoolYear,
  nextRound,
  type FaqItem
} from './content'
import {
  AdmissionRules,
  FaqSection,
  hostOf,
  SectionShell,
  SourceLink,
  StatGrid,
  SubHeading,
  useAdmissionStats,
  type DegreeTrack
} from './DegreeSections'
import { DegreeSubpageShell } from './DegreeSubpageShell'
import type { DegreeAdmissionPageData, DegreePageExtras } from './pageTypes'
import { ShowAllRows } from './ShowAllRows'
import { CNA_TYPES } from './subpages'

/** Year-by-year tables show this many recent years until expanded */
const RECENT_ROWS = 5

/**
 * `/:faculty/:degree/ingresso` (EN `/admission`): everything about getting in.
 * Licenciaturas and integrated masters: the Concurso Nacional in full (every
 * fase of every year, how first-years entered). Masters and pós-graduações:
 * what we have (fees) and prompts for the rest.
 */
export function DegreeAdmissionPage({
  faculty,
  degree,
  university,
  extras,
  data,
  faq
}: {
  faculty: Faculty
  degree: Degree
  university: CrumbUniversity | null
  extras: DegreePageExtras
  data: DegreeAdmissionPageData
  faq: FaqItem[]
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const track: DegreeTrack = {
    facultySlug: faculty.slug,
    degreeSlug: degree.slug,
    pageName: `${degree.acronym} (${faculty.shortName})`
  }
  const isCna = CNA_TYPES.has(degree.type)
  const admissions = extras.admissions
  const guide = admissions?.guide ?? null
  const series = admissions?.main.series ?? []
  const stats = useAdmissionStats(admissions)
  const { acronym } = degree

  const hasCna = stats.length > 0 || data.years.length > 0
  const hasFees = extras.fees !== null || data.feeHistory.length > 0
  const applyRoutes = extras.applyRoutes
  const hasApplyInfo = applyRoutes.length > 0
  const hasData = hasCna || hasFees || hasApplyInfo

  // Grades first, then the cost, then how to apply (the most technical part)
  const sections = [
    { id: 'resumo', label: t('degree_subpages.admission.sections.summary') },
    ...(data.years.length > 0
      ? [
          {
            id: 'historico',
            label: t('degree_subpages.admission.sections.history')
          }
        ]
      : []),
    ...(guide && (guide.provas.length > 0 || guide.formula)
      ? [
          {
            id: 'provas',
            label: t('degree_subpages.admission.sections.rules')
          }
        ]
      : []),
    { id: 'propinas', label: t('degree_subpages.admission.sections.fees') },
    ...(hasApplyInfo
      ? [
          {
            id: 'candidatura',
            label: t('degree_subpages.admission.apply.title')
          }
        ]
      : []),
    ...(faq.length > 0
      ? [{ id: 'faq', label: t('degree_page.sections.faq') }]
      : [])
  ]

  const [allYears, setAllYears] = useState(false)

  useEffect(() => {
    if (!faculty.slug || !degree.slug) return
    analytics.discovery.degreeSubpageViewed({
      facultySlug: faculty.slug,
      degreeSlug: degree.slug,
      page: 'admission',
      hasData,
      hasApplyInfo,
      applicationsOpen: applyRoutes.some(
        (r) => nextRound(r.rounds)?.status === 'open'
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faculty.slug, degree.slug])

  return (
    <DegreeSubpageShell
      faculty={faculty}
      degree={degree}
      university={university}
      universityName={extras.universityName}
      crumb={t('degree_subpages.tabs.admission')}
      title={t('degree_subpages.admission.h1', { name: degree.name })}
      sections={sections}
      reportSurface="degree_admission_page"
    >
      <SectionShell
        id="resumo"
        title={t('degree_subpages.admission.sections.summary')}
        first
      >
        {isCna ? (
          <AdmissionSummary
            admissions={admissions}
            fees={extras.fees}
            applyRoutes={applyRoutes}
            detailed
            missingGrade="missing"
            track={track}
          />
        ) : (
          <>
            {hasApplyInfo ? (
              <AdmissionSummary
                admissions={admissions}
                fees={extras.fees}
                applyRoutes={applyRoutes}
                detailed
                missingGrade={degree.type === 'master' ? 'unpublished' : null}
                track={track}
              />
            ) : (
              <p className="mb-3 max-w-prose">
                {t('degree_subpages.admission.intro_direct', { acronym })}
              </p>
            )}
            {!applyRoutes.some((r) => r.guide) && (
              <ContributeNote
                field="requirements"
                text={t('degree_subpages.admission.requirements_missing')}
                pageName={track.pageName}
                facultySlug={track.facultySlug}
                degreeSlug={track.degreeSlug}
              />
            )}
            {!applyRoutes.some((r) => r.rounds.length > 0) && (
              <ContributeNote
                className="mt-1"
                field="application_dates"
                text={t('degree_subpages.admission.dates_missing')}
                pageName={track.pageName}
                facultySlug={track.facultySlug}
                degreeSlug={track.degreeSlug}
              />
            )}
            {degree.url && (
              <p className="mt-3 text-sm">
                <a
                  href={degree.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primaryBlue hover:underline"
                >
                  {t('degree_subpages.admission.official_page', {
                    host: hostOf(degree.url)
                  })}
                </a>
              </p>
            )}
          </>
        )}
      </SectionShell>

      {data.years.length > 0 && admissions && (
        <SectionShell
          id="historico"
          title={t('degree_subpages.admission.sections.history')}
        >
          {series.length > 1 && (
            <AdmissionChart
              series={series}
              lang={lang}
              label={t('degree_page.admission.chart_label', {
                from: series[0].year,
                to: series[series.length - 1].year
              })}
            />
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm tabular-nums">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">
                    {t('degree_page.admission.table_year')}
                  </th>
                  {[1, 2, 3].map((fase) => (
                    <th
                      key={fase}
                      colSpan={fase === 1 ? 3 : 2}
                      className="py-1.5 pr-3 font-medium"
                    >
                      {t('degree_subpages.admission.table.fase', { fase })}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th />
                  <th className="py-1 pr-3 font-normal">
                    {t('degree_page.admission.table_vagas')}
                  </th>
                  <th className="py-1 pr-3 font-normal">
                    {t('degree_subpages.admission.table.placed')}
                  </th>
                  <th className="py-1 pr-3 font-normal">
                    {t('degree_page.admission.table_grade')}
                  </th>
                  {[2, 3].flatMap((fase) => [
                    <th key={`v${fase}`} className="py-1 pr-3 font-normal">
                      {t('degree_page.admission.table_vagas')}
                    </th>,
                    <th key={`g${fase}`} className="py-1 pr-3 font-normal">
                      {t('degree_page.admission.table_grade')}
                    </th>
                  ])}
                </tr>
              </thead>
              <tbody>
                {data.years
                  .slice(0, allYears ? undefined : RECENT_ROWS)
                  .map((y) => {
                    const f = (n: number) => y.fases.find((x) => x.fase === n)
                    const num = (v: number | null | undefined) =>
                      v != null ? formatInt(v, lang) : ''
                    const grade = (v: number | null | undefined) =>
                      v != null ? formatGrade(v, lang) : '–'
                    return (
                      <tr key={y.year} className="border-b border-border">
                        <td className="py-1.5 pr-3">{y.year}</td>
                        <td className="py-1.5 pr-3">{num(f(1)?.vagas)}</td>
                        <td className="py-1.5 pr-3">{num(f(1)?.colocados)}</td>
                        <td className="py-1.5 pr-3 font-semibold">
                          {grade(f(1)?.lastGrade)}
                        </td>
                        {[2, 3].flatMap((n) => [
                          <td key={`v${n}`} className="py-1.5 pr-3">
                            {num(f(n)?.vagas)}
                          </td>,
                          <td
                            key={`g${n}`}
                            className="py-1.5 pr-3 text-muted-foreground"
                          >
                            {f(n) ? grade(f(n)?.lastGrade) : ''}
                          </td>
                        ])}
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          {data.years.length > RECENT_ROWS && (
            <ShowAllRows
              total={data.years.length}
              expanded={allYears}
              onToggle={() => {
                if (!allYears && track.facultySlug && track.degreeSlug) {
                  analytics.discovery.degreeTableExpanded({
                    facultySlug: track.facultySlug,
                    degreeSlug: track.degreeSlug,
                    table: 'grades'
                  })
                }
                setAllYears(!allYears)
              }}
            />
          )}
          {admissions.afterWork.map((trackData) => {
            const last = trackData.series.at(-1)
            if (!last) return null
            const params = {
              grade: formatGrade(last.grade, lang),
              year: last.year,
              vagas: last.vagas
            }
            return (
              <p key={trackData.courseCode} className="mt-3 text-sm">
                {last.vagas !== null
                  ? t('degree_page.admission.after_work_vagas', params)
                  : t('degree_page.admission.after_work', params)}
              </p>
            )
          })}
          <p className="mt-4 text-xs text-muted-foreground">
            {t('degree_page.source_label')}{' '}
            <SourceLink href={admissions.dgesUrl} source="dges" track={track}>
              {t('degree_page.admission.source_years', {
                from: data.years.at(-1)!.year,
                to: data.years[0].year
              })}
            </SourceLink>
          </p>
        </SectionShell>
      )}

      {guide && (guide.provas.length > 0 || guide.formula) && (
        <SectionShell
          id="provas"
          title={t('degree_subpages.admission.sections.rules')}
        >
          <AdmissionRules guide={guide} showTitle={false} />
          <p className="mt-4 text-xs text-muted-foreground">
            {t('degree_page.source_label')}{' '}
            <SourceLink href={guide.sourceUrl} source="dges" track={track}>
              {t('degree_subpages.admission.source_guide', {
                year: guide.year
              })}
            </SourceLink>
          </p>
        </SectionShell>
      )}

      <SectionShell
        id="propinas"
        title={t('degree_subpages.admission.sections.fees')}
      >
        {extras.fees && (
          <>
            {/* The card's own title says the year: no heading above it */}
            <StatGrid>
              <TuitionStat fees={extras.fees} />
            </StatGrid>
          </>
        )}
        {data.feeHistory.length > 0 && (
          <FeeHistoryTable rows={data.feeHistory} track={track} />
        )}
        {!hasFees && (
          <ContributeNote
            field="fees"
            text={t('degree_page.fees.missing', {
              year: formatSchoolYear(getCurrentSchoolYear())
            })}
            pageName={track.pageName}
            facultySlug={track.facultySlug}
            degreeSlug={track.degreeSlug}
          />
        )}
      </SectionShell>

      {hasApplyInfo && (
        <SectionShell
          id="candidatura"
          title={t('degree_subpages.admission.apply.title')}
        >
          <AdmissionApply
            routes={applyRoutes}
            today={extras.today}
            track={track}
          />
        </SectionShell>
      )}

      {faq.length > 0 && (
        <FaqSection
          items={faq}
          surface="degree_admission_page"
          chatScope={{ degreeId: degree.id, scopeLabel: degree.acronym }}
        />
      )}
    </DegreeSubpageShell>
  )
}

const FEE_STUDENT_TYPES = ['national', 'international', 'all'] as const

function FeeHistoryTable({
  rows,
  track
}: {
  rows: DegreeAdmissionPageData['feeHistory']
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const [allYears, setAllYears] = useState(false)
  const byYear = new Map<number, typeof rows>()
  for (const row of rows) {
    byYear.set(row.schoolYear, [...(byYear.get(row.schoolYear) ?? []), row])
  }
  // One column per student type we have; a year without that type stays blank
  const columns = FEE_STUDENT_TYPES.filter((type) =>
    rows.some((r) => r.studentType === type)
  )
  // One source line under the table; years noted only when they differ by document
  const sourceYears = new Map<string, number[]>()
  for (const [year, yearRows] of byYear) {
    for (const url of new Set(yearRows.map((r) => r.sourceUrl))) {
      sourceYears.set(url, [...(sourceYears.get(url) ?? []), year])
    }
  }
  const sources = [...sourceYears.entries()]
  const years = [...byYear.entries()]
  return (
    <>
      <SubHeading>{t('degree_subpages.admission.fees_history')}</SubHeading>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-1.5 pr-3 font-medium">
                {t('degree_subpages.admission.fees_year')}
              </th>
              {columns.map((type) => (
                <th key={type} className="py-1.5 pr-3 font-medium">
                  {t(`degree_subpages.admission.fees_student.${type}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years
              .slice(0, allYears ? undefined : RECENT_ROWS)
              .map(([year, yearRows]) => (
                <tr key={year} className="border-b border-border align-top">
                  <td className="py-1.5 pr-3 tabular-nums">
                    {formatSchoolYear(year)}
                  </td>
                  {columns.map((type) => (
                    <td key={type} className="py-1.5 pr-3 tabular-nums">
                      {yearRows
                        .filter((r) => r.studentType === type)
                        .map((row, i) => (
                          <span key={i} className="block">
                            {formatEur(row.amountEur, lang)}{' '}
                            <span className="text-muted-foreground">
                              {t(`degree_page.fees.period.${row.period}`, {
                                defaultValue: row.period
                              })}
                            </span>
                          </span>
                        ))}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {years.length > RECENT_ROWS && (
        <ShowAllRows
          total={years.length}
          expanded={allYears}
          onToggle={() => {
            if (!allYears && track.facultySlug && track.degreeSlug) {
              analytics.discovery.degreeTableExpanded({
                facultySlug: track.facultySlug,
                degreeSlug: track.degreeSlug,
                table: 'fees'
              })
            }
            setAllYears(!allYears)
          }}
        />
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        {t('degree_page.source_label')}{' '}
        {sources.map(([url, years], i) => (
          <span key={url}>
            {i > 0 && ' · '}
            <SourceLink href={url} source="fees" track={track}>
              {hostOf(url)}
              {sources.length > 1 &&
                ` (${years.map((y) => formatSchoolYear(y)).join(', ')})`}
            </SourceLink>
          </span>
        ))}
      </p>
    </>
  )
}
