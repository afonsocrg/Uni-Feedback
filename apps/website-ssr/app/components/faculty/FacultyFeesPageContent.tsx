import type { DegreeType, Faculty } from '@uni-feedback/db/schema'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import {
  FACULTY_TYPE_SEGMENTS,
  getFacultyTypePath,
  isFacultyTypePage
} from '~/utils/facultyTypePages'
import { getFacultyPath, getUniversityPath } from '~/utils/i18n-routes'
import { formatInt, formatSchoolYear } from '../degree/content'
import { FaqSection, SectionShell } from '../degree/DegreeSections'
import { FacultyPageShell } from './FacultyPageShell'
import {
  CompareTable,
  DegreeCell,
  FacultyRelatedSection,
  NoData,
  SourceNote,
  trackFacultyLink,
  type FacultyTrack,
  type RelatedLink
} from './FacultySections'
import {
  buildFeesFaq,
  feeAmountText,
  feeSectionTypes,
  feesOfType,
  hasAnyFee,
  nextYearNote,
  summarizeFees,
  type FeeSide
} from './feesContent'
import type { FacultyFeesPageData, FeeAmount, FeesPageDegree } from './types'

/** Source links listed before "and N more pages" */
const SOURCES_SHOWN = 5

/** "fenix.tecnico.ulisboa.pt/candidaturas/propinas" */
function sourceLabel(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/+$/, '')
    const label = `${u.host.replace(/^www\./, '')}${path}`
    return label.length > 60 ? `${label.slice(0, 57)}...` : label
  } catch {
    return url
  }
}

/**
 * Every degree's fee at a faculty for this school year (`/ist/propinas`):
 * one table per degree type, national and international, then where the
 * figures come from, FAQ and links. Answers "propinas IST" style searches,
 * which the degree pages only answer one degree at a time.
 */
export function FacultyFeesPageContent({
  faculty,
  data
}: {
  faculty: Faculty
  data: FacultyFeesPageData
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const facultySlug = faculty.slug ?? ''
  const track: FacultyTrack = { facultySlug, page: 'fees' }
  const year = formatSchoolYear(data.schoolYear)
  const types = feeSectionTypes(data)
  const withFee = data.degrees.filter(hasAnyFee)
  const feeText = (fee: FeesPageDegree['national'][number]) =>
    feeAmountText(t, lang, fee)

  const facts: ReactNode[] = [
    <span key="year">{t('faculty_fees.facts.year', { year })}</span>,
    <span key="count">
      {t('faculty_fees.facts.count', {
        count: withFee.length,
        n: formatInt(withFee.length, lang)
      })}
    </span>
  ]
  const nextNote = nextYearNote(t, data, 'about.next')
  const bachelors = summarizeFees(feesOfType(data, 'bachelor'), 'national')
  if (bachelors && bachelors.min.amountEur === bachelors.max.amountEur) {
    facts.push(
      <span key="bachelor">
        {t('faculty_fees.facts.bachelor', { fee: feeText(bachelors.min) })}
      </span>
    )
  }
  const nextFact = nextYearNote(t, data, 'facts.next')
  if (nextFact) facts.push(<span key="next">{nextFact}</span>)

  const sectionId = (type: DegreeType) =>
    isFacultyTypePage(type) ? FACULTY_TYPE_SEGMENTS[type].pt : type

  const faq = buildFeesFaq(t, lang, faculty.shortName, data)

  const related: RelatedLink[] = [
    {
      key: 'hub',
      kicker: t('faculty_hub.related.faculty'),
      label: faculty.name,
      href: getFacultyPath(lang, facultySlug),
      target: 'faculty'
    },
    ...data.types.filter(isFacultyTypePage).map((type) => ({
      key: type,
      kicker: t('faculty_hub.related.type_page', { name: faculty.shortName }),
      label: t(`degree_types.${type}`),
      href: getFacultyTypePath(lang, facultySlug, type),
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

  const sections = [
    ...types.map((type) => ({
      id: sectionId(type),
      label: t(`degree_types.${type}`)
    })),
    { id: 'sobre', label: t('faculty_fees.sections.about') },
    ...(faq.length > 0
      ? [{ id: 'faq', label: t('degree_page.sections.faq') }]
      : []),
    { id: 'relacionados', label: t('faculty_hub.sections.related') }
  ]

  const nextYear = formatSchoolYear(data.schoolYear + 1)
  const sameFees = (a: FeeAmount[], b: FeeAmount[]) =>
    a.length === b.length &&
    a.every(
      (fee, i) => fee.amountEur === b[i].amountEur && fee.period === b[i].period
    )
  // This year's fee, and under it next year's once published
  const feeCell = (d: FeesPageDegree, side: FeeSide) => {
    const next = d.next[side]
    return (
      <span className="tabular-nums">
        {d[side].length > 0 ? (
          d[side].map((fee, i) => (
            <span key={i} className="block">
              {feeText(fee)}
            </span>
          ))
        ) : (
          <NoData />
        )}
        {next.length > 0 && (
          <span className="block text-xs text-muted-foreground">
            {sameFees(d[side], next)
              ? t('faculty_fees.table.next_same', { next: nextYear })
              : t('faculty_fees.table.next', {
                  next: nextYear,
                  fee: next.map(feeText).join(', ')
                })}
          </span>
        )}
      </span>
    )
  }

  const shownSources = data.sourceUrls.slice(0, SOURCES_SHOWN)
  const moreSources = data.sourceUrls.length - shownSources.length

  return (
    <FacultyPageShell
      facultySlug={facultySlug}
      facultyShortName={faculty.shortName}
      facultyName={faculty.name}
      university={data.university}
      page="fees"
      crumb={t('faculty_fees.crumb')}
      title={t('faculty_fees.title', { name: faculty.name, year })}
      subtitle={t('faculty_fees.intro', { name: faculty.shortName, year })}
      facts={facts}
      sections={sections}
      degreeCount={withFee.length}
    >
      {types.map((type, i) => {
        const degrees = feesOfType(data, type)
        const showInternational = degrees.some(
          (d) => d.international.length > 0 || d.next.international.length > 0
        )
        return (
          <SectionShell
            key={type}
            id={sectionId(type)}
            title={t(`degree_types.${type}`)}
            first={i === 0}
          >
            <CompareTable
              minWidth="min-w-[28rem]"
              head={[
                t('faculty_page.column_degree'),
                t('faculty_fees.table.national'),
                ...(showInternational
                  ? [t('faculty_fees.table.international')]
                  : [])
              ]}
              rows={degrees.map((d) => ({
                key: d.id,
                cells: [
                  <DegreeCell
                    key="degree"
                    facultySlug={facultySlug}
                    degree={d}
                    track={track}
                    surface={`fees_${type}`}
                  />,
                  <span key="national">{feeCell(d, 'national')}</span>,
                  ...(showInternational
                    ? [
                        <span key="international">
                          {feeCell(d, 'international')}
                        </span>
                      ]
                    : [])
                ]
              }))}
            />
          </SectionShell>
        )
      })}

      <SectionShell id="sobre" title={t('faculty_fees.sections.about')}>
        <div className="space-y-2 text-foreground">
          <p>{t('faculty_fees.about.year', { year })}</p>
          <p>{t('faculty_fees.about.student_types')}</p>
          {nextNote && <p>{nextNote}</p>}
          <p>{t('faculty_fees.about.check')}</p>
        </div>
        {shownSources.length > 0 && (
          <SourceNote>
            {t('degree_page.source_label')}{' '}
            {shownSources.map((url, i) => (
              <span key={url}>
                {i > 0 && ', '}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackFacultyLink(track, 'fee_source', 'about')}
                  className="text-primaryBlue hover:underline"
                >
                  {sourceLabel(url)}
                </a>
              </span>
            ))}
            {moreSources > 0 &&
              ` ${t('faculty_fees.about.more_sources', { count: moreSources })}`}
            {data.fetchedAt &&
              `. ${t('faculty_fees.about.fetched', {
                date: new Intl.DateTimeFormat(
                  lang === 'en' ? 'en-GB' : 'pt-PT',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }
                ).format(new Date(data.fetchedAt))
              })}`}
          </SourceNote>
        )}
      </SectionShell>

      {faq.length > 0 && <FaqSection items={faq} surface="faculty_fees_page" />}

      <FacultyRelatedSection links={related} track={track} />
    </FacultyPageShell>
  )
}
