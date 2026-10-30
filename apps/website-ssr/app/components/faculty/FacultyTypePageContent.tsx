import type { Faculty } from '@uni-feedback/db/schema'
import { Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang, useWorkloadLabel } from '~/hooks'
import {
  getFacultyTypePath,
  isFacultyTypePage,
  type FacultyTypePage
} from '~/utils/facultyTypePages'
import {
  getCoursePath,
  getDegreeAdmissionPath,
  getDegreePath,
  getFacultyPath,
  getUniversityPath
} from '~/utils/i18n-routes'
import { InfoPopover } from '../common/InfoPopover'
import {
  formatGrade,
  formatInt,
  formatNumber,
  formatPct,
  type FaqItem
} from '../degree/content'
import { FaqSection, SectionShell } from '../degree/DegreeSections'
import { FacultyPageShell } from './FacultyPageShell'
import {
  CompareTable,
  DegreeCell,
  FacultyHighlightsSection,
  FacultyRelatedSection,
  hasHighlights,
  NoData,
  SourceNote,
  trackFacultyLink,
  type FacultyTrack,
  type RelatedLink
} from './FacultySections'
import { useFeeText } from './fees'
import type { FacultyTypePageData, TypePageDegree } from './types'

const CNA_TYPES = new Set<FacultyTypePage>(['bachelor', 'integrated_master'])

/**
 * A faculty's degrees of one type (`/ist/licenciaturas`, ...),
 * prds/content_rich_pages.md "Degree type": a comparison table with the
 * signals each type has (CNA vagas and entry grades for licenciaturas, fees and
 * completion for mestrados, size for minors), then what only that type has
 * (the shared first year, pathways), the courses students talk about, FAQ and
 * links. No averaged degree rating: the students' signal stays on courses.
 */
export function FacultyTypePageContent({
  faculty,
  type,
  data
}: {
  faculty: Faculty
  type: FacultyTypePage
  data: FacultyTypePageData
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const feeText = useFeeText()
  const workloadLabel = useWorkloadLabel()
  const facultySlug = faculty.slug ?? ''
  const track: FacultyTrack = { facultySlug, page: type }
  const { degrees } = data
  const isCna = CNA_TYPES.has(type)
  // A campus column only tells degrees apart when they don't all share one
  const multiCampus = new Set(degrees.flatMap((d) => d.campuses)).size > 1
  const typeLabel = t(`degree_types.${type}`)

  // Licenciaturas by entry grade; the rest by feedback
  const rows = [...degrees].sort((a, b) =>
    isCna
      ? (b.admission?.lastGrade ?? -1) - (a.admission?.lastGrade ?? -1) ||
        b.feedbackCount - a.feedbackCount
      : b.feedbackCount - a.feedbackCount
  )
  const admissionYear = Math.max(
    0,
    ...degrees.map((d) => d.admission?.year ?? 0)
  )
  const graded = rows.filter(
    (d) => d.admission?.year === admissionYear && d.admission.lastGrade !== null
  )
  const totalVagas = degrees.reduce(
    (s, d) =>
      s + (d.admission?.year === admissionYear ? (d.admission.vagas ?? 0) : 0),
    0
  )
  const fees = degrees.map((d) => d.fee).filter((f) => f !== null)
  const uniformFee =
    fees.length === degrees.length &&
    fees.length > 0 &&
    fees.every(
      (f) => f.amountEur === fees[0].amountEur && f.period === fees[0].period
    )
      ? fees[0]
      : null
  const english = degrees.filter(
    (d) => d.teachingLanguage === 'en' || d.teachingLanguage === 'pt_en'
  )

  const facts: ReactNode[] = [
    <span key="count">
      <b>{formatNumber(degrees.length, lang)}</b>{' '}
      {t(`faculty_hub.type_count_label.${type}`, { count: degrees.length })}
    </span>
  ]
  if (isCna && totalVagas > 0) {
    facts.push(
      <span key="vagas">
        {t('faculty_hub.facts.vagas', {
          n: formatInt(totalVagas, lang),
          year: admissionYear
        })}
      </span>
    )
  }
  if (uniformFee) facts.push(<span key="fee">{feeText(uniformFee)}</span>)
  if (!isCna && english.length > 0) {
    facts.push(
      <span key="en">
        {t('faculty_hub.facts.english', {
          count: english.length,
          n: formatNumber(english.length, lang)
        })}
      </span>
    )
  }

  const cell = {
    degree: (d: TypePageDegree) => (
      <DegreeCell
        facultySlug={facultySlug}
        degree={d}
        track={track}
        surface="compare_table"
      />
    ),
    campus: (d: TypePageDegree) =>
      d.campuses.length > 0 ? d.campuses.join(', ') : <NoData />,
    vagas: (d: TypePageDegree) =>
      d.admission?.year === admissionYear && d.admission.vagas !== null ? (
        <>
          {formatInt(d.admission.vagas, lang)}
          {d.admission.colocados !== null &&
            d.admission.colocados < d.admission.vagas && (
              <span className="block text-xs text-muted-foreground">
                {t('faculty_hub.table.placed', {
                  n: formatInt(d.admission.colocados, lang)
                })}
              </span>
            )}
        </>
      ) : (
        <NoData />
      ),
    grade: (d: TypePageDegree) => {
      const a = d.admission
      if (!a || a.year !== admissionYear || a.lastGrade === null)
        return <NoData />
      const delta =
        a.previousGrade !== null ? a.lastGrade - a.previousGrade : null
      return (
        <>
          <b>{formatGrade(a.lastGrade, lang)}</b>
          {delta !== null && a.previousYear && (
            <span className="block text-xs text-muted-foreground">
              {delta > 0 ? '▲' : delta < 0 ? '▼' : '='}{' '}
              {formatGrade(Math.abs(delta), lang)}{' '}
              {t('faculty_hub.table.vs_year', { year: a.previousYear })}
            </span>
          )}
          {d.slug && (
            <Link
              to={getDegreeAdmissionPath(lang, facultySlug, d.slug)}
              onClick={() =>
                trackFacultyLink(track, 'degree_admission', 'compare_table')
              }
              className="block text-xs text-primaryBlue hover:underline"
            >
              {t('faculty_hub.table.admission_link')}
            </Link>
          )}
        </>
      )
    },
    employability: (d: TypePageDegree) =>
      d.employability !== null ? formatPct(d.employability, lang) : <NoData />,
    completion: (d: TypePageDegree) =>
      d.completion !== null ? formatPct(d.completion, lang) : <NoData />,
    fee: (d: TypePageDegree) => (d.fee ? feeText(d.fee) : <NoData />),
    language: (d: TypePageDegree) =>
      d.teachingLanguage ? (
        t(`faculty_hub.table.language.${d.teachingLanguage}`, {
          defaultValue: d.teachingLanguage
        })
      ) : (
        <NoData />
      ),
    ects: (d: TypePageDegree) =>
      d.ects ? formatNumber(d.ects, lang) : <NoData />,
    courses: (d: TypePageDegree) => formatInt(d.courseCount, lang),
    feedback: (d: TypePageDegree) => formatInt(d.feedbackCount, lang)
  }

  const employabilityHead = (
    <span className="inline-flex items-center gap-1">
      {t('faculty_hub.table.employability')}
      <InfoPopover
        content={t('faculty_hub.table.employability_info')}
        label={t('faculty_hub.table.employability_info')}
        className="[&_svg]:size-3.5"
      />
    </span>
  )

  type Column = [ReactNode, (d: TypePageDegree) => ReactNode]
  const columns: Column[] = isCna
    ? [
        [t('faculty_page.column_degree'), cell.degree],
        ...(multiCampus
          ? [[t('faculty_hub.table.campus'), cell.campus] as Column]
          : []),
        [t('faculty_hub.table.vagas', { year: admissionYear }), cell.vagas],
        [
          t('faculty_hub.table.last_grade', { year: admissionYear }),
          cell.grade
        ],
        [employabilityHead, cell.employability],
        [t('faculty_hub.table.feedback'), cell.feedback]
      ]
    : type === 'minor'
      ? [
          [t('faculty_page.column_degree'), cell.degree],
          ...(multiCampus
            ? [[t('faculty_hub.table.campus'), cell.campus] as Column]
            : []),
          [t('faculty_hub.table.ects'), cell.ects],
          [t('faculty_page.column_courses'), cell.courses],
          [t('faculty_hub.table.feedback'), cell.feedback]
        ]
      : [
          [t('faculty_page.column_degree'), cell.degree],
          [t('faculty_hub.table.language_head'), cell.language],
          [t('faculty_hub.table.ects'), cell.ects],
          [t('faculty_hub.table.fee'), cell.fee],
          ...(type === 'master'
            ? [[t('faculty_hub.table.completion'), cell.completion] as Column]
            : []),
          [t('faculty_hub.table.feedback'), cell.feedback]
        ]

  const pathwaysBySource = new Map<
    string,
    { slug: string; targets: typeof data.pathways }
  >()
  for (const p of data.pathways) {
    const entry = pathwaysBySource.get(p.fromAcronym) ?? {
      slug: p.fromSlug,
      targets: []
    }
    entry.targets.push(p)
    pathwaysBySource.set(p.fromAcronym, entry)
  }

  const faq: FaqItem[] = []
  if (isCna && graded[0]) {
    const top = graded[0]
    faq.push({
      topic: 'admission_grade',
      isMarkdown: false,
      question: t('faculty_hub.faq.type_highest_grade_q', {
        type: typeLabel.toLowerCase(),
        name: faculty.shortName
      }),
      answer: t('faculty_hub.faq.highest_grade_a', {
        acronym: top.acronym,
        grade: formatGrade(top.admission!.lastGrade!, lang),
        year: admissionYear
      })
    })
  }
  if (isCna && totalVagas > 0) {
    faq.push({
      topic: 'vagas',
      isMarkdown: false,
      question: t('faculty_hub.faq.vagas_q', {
        type: typeLabel.toLowerCase(),
        name: faculty.shortName
      }),
      answer: t('faculty_hub.faq.vagas_a', {
        n: formatInt(totalVagas, lang),
        year: admissionYear,
        count: degrees.length
      })
    })
  }
  if (!isCna && type !== 'minor' && degrees.length > 0) {
    faq.push({
      topic: 'language',
      isMarkdown: false,
      question: t('faculty_hub.faq.english_q', {
        type: typeLabel.toLowerCase(),
        name: faculty.shortName
      }),
      answer: t('faculty_hub.faq.english_a', {
        n: english.length,
        total: degrees.length
      })
    })
  }
  if (fees.length > 0) {
    const amounts = fees.map((f) => f.amountEur)
    faq.push({
      topic: 'fees',
      isMarkdown: false,
      question: t('faculty_hub.faq.type_fee_q', {
        type: typeLabel.toLowerCase(),
        name: faculty.shortName
      }),
      answer: uniformFee
        ? t('faculty_hub.faq.fee_a', { fee: feeText(uniformFee) })
        : t('faculty_hub.faq.fee_range_a', {
            min: feeText(fees[amounts.indexOf(Math.min(...amounts))]),
            max: feeText(fees[amounts.indexOf(Math.max(...amounts))])
          })
    })
  }

  const related: RelatedLink[] = [
    {
      key: 'hub',
      kicker: t('faculty_hub.related.faculty'),
      label: faculty.name,
      href: getFacultyPath(lang, facultySlug),
      target: 'faculty'
    },
    ...data.otherTypes.filter(isFacultyTypePage).map((other) => ({
      key: other,
      kicker: t('faculty_hub.related.type_page', { name: faculty.shortName }),
      label: t(`degree_types.${other}`),
      href: getFacultyTypePath(lang, facultySlug, other),
      target: 'type_page' as const
    })),
    ...(data.university
      ? [
          {
            key: 'university',
            kicker: t('faculty_hub.related.university'),
            label: data.university.name,
            href: getUniversityPath(lang, data.university.slug),
            target: 'university' as const
          }
        ]
      : [])
  ]

  const showHighlights = hasHighlights(data.highlights)
  const sections = [
    { id: 'comparar', label: t('faculty_hub.sections.compare') },
    ...(data.firstYear.length > 0
      ? [{ id: 'primeiro-ano', label: t('faculty_hub.sections.first_year') }]
      : []),
    ...(pathwaysBySource.size > 0
      ? [{ id: 'percursos', label: t('faculty_hub.sections.pathways') }]
      : []),
    ...(showHighlights
      ? [{ id: 'cadeiras', label: t('faculty_hub.sections.highlights_short') }]
      : []),
    ...(faq.length > 0
      ? [{ id: 'faq', label: t('degree_page.sections.faq') }]
      : []),
    { id: 'relacionados', label: t('faculty_hub.sections.related') }
  ]

  const sources: string[] = []
  if (isCna) sources.push(t('faculty_hub.sources.cna', { year: admissionYear }))
  if (isCna || type === 'master')
    sources.push(t('faculty_hub.sources.infocursos'))
  if (fees.length > 0) sources.push(t('faculty_hub.sources.fees'))

  return (
    <FacultyPageShell
      facultySlug={facultySlug}
      facultyShortName={faculty.shortName}
      facultyName={faculty.name}
      university={data.university}
      page={type}
      crumb={typeLabel}
      title={t('faculty_hub.type_title', {
        type: typeLabel,
        name: faculty.name
      })}
      subtitle={t(`faculty_hub.type_intro.${type}`, {
        count: degrees.length,
        n: formatNumber(degrees.length, lang)
      })}
      facts={facts}
      sections={sections}
      degreeCount={degrees.length}
    >
      <SectionShell
        id="comparar"
        title={t('faculty_hub.sections.compare')}
        first
      >
        <CompareTable
          head={columns.map(([head]) => head)}
          rows={rows.map((d) => ({
            key: d.id,
            cells: columns.map(([, render], i) => (
              <span key={i}>{render(d)}</span>
            ))
          }))}
        />
        {sources.length > 0 && <SourceNote>{sources.join(' ')}</SourceNote>}
      </SectionShell>

      {data.firstYear.length > 0 && (
        <SectionShell
          id="primeiro-ano"
          title={t('faculty_hub.sections.first_year')}
        >
          <p className="mb-3 text-foreground">
            {t('faculty_hub.first_year.intro')}
          </p>
          <CompareTable
            minWidth="min-w-[28rem]"
            head={[
              t('faculty_hub.first_year.course'),
              t('faculty_hub.first_year.degrees'),
              t('faculty_hub.first_year.rating'),
              t('faculty_hub.first_year.workload')
            ]}
            rows={data.firstYear.map((c) => ({
              key: c.courseId,
              cells: [
                <Link
                  key="c"
                  to={getCoursePath(lang, c.courseId)}
                  onClick={() =>
                    trackFacultyLink(track, 'course', 'first_year')
                  }
                  className="text-primaryBlue hover:underline"
                >
                  {c.name}
                </Link>,
                t('faculty_hub.first_year.in_n', {
                  n: c.degreeCount,
                  total: degrees.length
                }),
                c.rating !== null && c.feedbackCount > 0 ? (
                  <span key="r" className="inline-flex items-center gap-1">
                    <Star
                      aria-hidden="true"
                      className="size-3.5 fill-rating text-rating"
                    />
                    {formatGrade(c.rating, lang)}
                  </span>
                ) : (
                  <NoData key="r" />
                ),
                c.workload !== null && c.feedbackCount > 0 ? (
                  workloadLabel(c.workload)
                ) : (
                  <NoData key="w" />
                )
              ]
            }))}
          />
          <SourceNote>{t('faculty_hub.first_year.hint')}</SourceNote>
        </SectionShell>
      )}

      {pathwaysBySource.size > 0 && (
        <SectionShell id="percursos" title={t('faculty_hub.sections.pathways')}>
          <CompareTable
            minWidth="min-w-[20rem]"
            head={[
              t('faculty_hub.pathways.from'),
              t('faculty_hub.pathways.to')
            ]}
            rows={[...pathwaysBySource.entries()].map(([acronym, p]) => ({
              key: acronym,
              cells: [
                <Link
                  key="from"
                  to={getDegreePath(lang, facultySlug, p.slug)}
                  onClick={() => trackFacultyLink(track, 'degree', 'pathways')}
                  className="font-semibold text-primaryBlue hover:underline"
                >
                  {acronym}
                </Link>,
                <span key="to">
                  {p.targets.map((target, i) => (
                    <span key={`${target.toFacultySlug}/${target.toSlug}`}>
                      {i > 0 && ', '}
                      <Link
                        to={getDegreePath(
                          lang,
                          target.toFacultySlug,
                          target.toSlug
                        )}
                        onClick={() =>
                          trackFacultyLink(track, 'degree', 'pathways')
                        }
                        className="text-primaryBlue hover:underline"
                      >
                        {target.toAcronym}
                      </Link>
                    </span>
                  ))}
                </span>
              ]
            }))}
          />
        </SectionShell>
      )}

      {showHighlights && (
        <FacultyHighlightsSection highlights={data.highlights} track={track} />
      )}

      {faq.length > 0 && <FaqSection items={faq} surface="faculty_type_page" />}

      <FacultyRelatedSection links={related} track={track} />
    </FacultyPageShell>
  )
}
