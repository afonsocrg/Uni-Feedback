import type { DegreeType, Faculty } from '@uni-feedback/db/schema'
import { DEGREE_TYPES } from '@uni-feedback/db/schema'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { getFacultyTypePath, isFacultyTypePage } from '~/utils/facultyTypePages'
import {
  getFacultyAdmissionsPath,
  getFacultyFeesPath,
  getUniversityPath
} from '~/utils/i18n-routes'
import { LocalizedText } from '../common/LocalizedText'
import { OfficialLinks } from '../common/OfficialLinks'
import { ToggleChip } from '../common/ToggleChip'
import type { FaqItem } from '../degree/content'
import {
  formatGrade,
  formatInt,
  formatIsoDay,
  formatNumber,
  formatSchoolYear
} from '../degree/content'
import { FaqSection, SectionShell } from '../degree/DegreeSections'
import {
  applySectionLabel,
  applyStatus,
  applyStatusShort
} from './admissionsContent'
import { StatusDot } from './FacultyAdmissionsPageContent'
import { FacultyPageShell } from './FacultyPageShell'
import {
  ArrowLink,
  CampusesSection,
  CompareTable,
  DegreeCell,
  FacultyRelatedSection,
  NoData,
  trackFacultyLink,
  type FacultyTrack,
  type RelatedLink
} from './FacultySections'
import { useFeeText } from './fees'
import type { FacultyDegree, FacultyHubData } from './types'

/**
 * A type with more degrees than this lists only this many, the most reviewed
 * (the loader sorts by feedback), ending in a "Ver mais N" link to its type
 * page. A type with no page of its own (`other`) is listed in full.
 */
const MAX_TYPE_DEGREES = 8

/**
 * The faculty hub (`/ist`), prds/content_rich_pages.md "Faculty": what the
 * faculty is, then the degree table (what students come for), one table per
 * type behind chips, each capped and linking to its type page; then the
 * courses students talk about, campuses, FAQ and related links. Every section
 * renders only with data. No search box: the type pages list every degree.
 */
export function FacultyHubContent({
  faculty,
  data
}: {
  faculty: Faculty
  data: FacultyHubData
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const feeText = useFeeText()
  const facultySlug = faculty.slug ?? ''
  const track: FacultyTrack = { facultySlug, page: 'hub' }
  const { degrees, admissionSummary: adm } = data
  // A campus column only tells degrees apart when they don't all share one
  const multiCampus = new Set(degrees.flatMap((d) => d.campuses)).size > 1

  const types = useMemo(
    () => DEGREE_TYPES.filter((type) => degrees.some((d) => d.type === type)),
    [degrees]
  )
  const [selectedType, setSelectedType] = useState<DegreeType | null>(null)
  const activeType = selectedType ?? types[0] ?? null

  const count = (type: DegreeType) =>
    degrees.filter((d) => d.type === type).length

  const faq: FaqItem[] = []
  if (adm?.highest) {
    faq.push({
      topic: 'admission_grade',
      isMarkdown: false,
      question: t('faculty_hub.faq.highest_grade_q', {
        name: faculty.shortName
      }),
      answer: t('faculty_hub.faq.highest_grade_a', {
        acronym: adm.highest.acronym,
        grade: formatGrade(adm.highest.grade, lang),
        year: adm.year
      })
    })
  }
  if (adm?.fee) {
    faq.push({
      topic: 'fees',
      isMarkdown: false,
      question: t('faculty_hub.faq.fee_q', { name: faculty.shortName }),
      answer: t('faculty_hub.faq.fee_a', { fee: feeText(adm.fee) })
    })
  }
  if (data.campuses.length > 0) {
    faq.push({
      topic: 'campuses',
      isMarkdown: false,
      question: t('faculty_hub.faq.campuses_q', { name: faculty.shortName }),
      answer: data.campuses
        .map((c) => (c.city ? `${c.name} (${c.city})` : c.name))
        .join(', ')
    })
  }

  const related: RelatedLink[] = [
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
      : []),
    ...types.filter(isFacultyTypePage).map((type) => ({
      key: type,
      kicker: t('faculty_hub.related.type_page', { name: faculty.shortName }),
      label: t(`degree_types.${type}`),
      href: getFacultyTypePath(lang, facultySlug, type),
      target: 'type_page' as const
    })),
    ...(data.apply
      ? [
          {
            key: 'admissions',
            kicker: t('faculty_admissions.related.kicker'),
            label: t('faculty_admissions.related.label'),
            href: getFacultyAdmissionsPath(lang, facultySlug),
            target: 'admissions_page' as const
          }
        ]
      : []),
    ...(data.hasFeesPage
      ? [
          {
            key: 'fees',
            kicker: t('faculty_fees.related.kicker'),
            label: t('faculty_fees.related.label', {
              year: formatSchoolYear(getCurrentSchoolYear())
            }),
            href: getFacultyFeesPath(lang, facultySlug),
            target: 'fees_page' as const
          }
        ]
      : [])
  ]

  // Routes with a round open today: the banner under the intro
  const openSections = (data.apply?.sections ?? []).filter(
    (s) => applyStatus(s.view).status === 'open'
  )

  const sections = [
    { id: 'cursos', label: t('faculty_hub.sections.courses') },
    ...(data.apply
      ? [
          {
            id: 'candidaturas',
            label: t('faculty_admissions.hub.section_title')
          }
        ]
      : []),
    ...(data.campuses.length > 0
      ? [
          {
            id: 'campi',
            label: t(
              data.campuses.length > 1
                ? 'faculty_hub.sections.campuses'
                : 'faculty_hub.sections.campus'
            )
          }
        ]
      : []),
    ...(faq.length > 0
      ? [{ id: 'faq', label: t('degree_page.sections.faq') }]
      : []),
    ...(related.length > 0
      ? [{ id: 'relacionados', label: t('faculty_hub.sections.related') }]
      : [])
  ]

  return (
    <FacultyPageShell
      facultySlug={facultySlug}
      facultyShortName={faculty.shortName}
      facultyName={faculty.name}
      university={data.university}
      page="hub"
      title={faculty.name}
      eyebrow={
        data.university ? (
          <a
            href={getUniversityPath(lang, data.university.slug)}
            onClick={() => trackFacultyLink(track, 'university', 'header')}
            className="hover:text-foreground hover:underline"
          >
            {data.university.name}
          </a>
        ) : null
      }
      facts={[]}
      school={faculty}
      links={
        <OfficialLinks
          name={faculty.shortName}
          website={faculty.url}
          links={data.links}
          className="mt-1"
          onClick={(target) => trackFacultyLink(track, target, 'header')}
        />
      }
      sections={sections}
      degreeCount={degrees.length}
      applicationsOpen={openSections.length > 0}
    >
      {data.intro && (
        <SectionShell id="sobre" first>
          <LocalizedText text={data.intro} />
        </SectionShell>
      )}

      {openSections.length > 0 && (
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 rounded-lg border border-border px-4 py-3">
          <p className="flex items-baseline gap-2">
            <StatusDot status="open" />
            <span>
              <b className="font-semibold">
                {t('faculty_admissions.hub.banner_title')}
              </b>
              {': '}
              {openSections
                .map((s) => {
                  const closesOn = applyStatus(s.view).next?.closesOn
                  const label = applySectionLabel(t, s)
                  return closesOn
                    ? t('faculty_admissions.hub.banner_item', {
                        label,
                        date: formatIsoDay(closesOn, lang)
                      })
                    : label
                })
                .join('; ')}
              .
            </span>
          </p>
          <Link
            to={getFacultyAdmissionsPath(lang, facultySlug)}
            onClick={() => trackFacultyLink(track, 'admissions_page', 'banner')}
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-primaryBlue hover:underline"
          >
            {t('faculty_admissions.hub.banner_link')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      )}

      <SectionShell
        id="cursos"
        title={t('faculty_hub.sections.courses')}
        first={!data.intro}
      >
        {types.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {types.map((type) => (
              <ToggleChip
                key={type}
                label={`${t(`degree_types.${type}`)} (${count(type)})`}
                isActive={type === activeType}
                onClick={() => {
                  setSelectedType(type)
                  analytics.faculty.degreeTypeSelected({ facultySlug, type })
                }}
              />
            ))}
          </div>
        )}
        {/* Every type's table is in the HTML; the chips only show one */}
        {types.map((type) => {
          const all = degrees.filter((d) => d.type === type)
          const hasPage = isFacultyTypePage(type)
          const rows = hasPage ? all.slice(0, MAX_TYPE_DEGREES) : all
          const more = all.length - rows.length
          return (
            <div
              key={type}
              hidden={type !== activeType}
              className={types.length > 1 ? 'mt-3' : undefined}
            >
              <CompareTable
                minWidth="min-w-[28rem]"
                head={[
                  t('faculty_page.column_degree'),
                  ...(multiCampus ? [t('faculty_hub.table.campus')] : []),
                  t('faculty_hub.table.duration'),
                  t('faculty_hub.table.feedback')
                ]}
                rows={rows.map((d) => ({
                  key: d.id,
                  cells: [
                    <DegreeCell
                      key="d"
                      facultySlug={facultySlug}
                      degree={d}
                      track={track}
                      surface="courses_table"
                    />,
                    ...(multiCampus
                      ? [
                          d.campuses.length > 0 ? (
                            d.campuses.join(', ')
                          ) : (
                            <NoData key="c" />
                          )
                        ]
                      : []),
                    <DurationCell key="t" degree={d} />,
                    formatInt(d.feedbackCount, lang)
                  ]
                }))}
              />
              {hasPage && more > 0 && (
                <Link
                  to={getFacultyTypePath(lang, facultySlug, type)}
                  onClick={() =>
                    trackFacultyLink(track, 'type_page', 'courses_table_more')
                  }
                  className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  {t(`faculty_hub.more.${type}`, { count: more })}
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              )}
              {hasPage && (
                <div>
                  <ArrowLink
                    to={getFacultyTypePath(lang, facultySlug, type)}
                    onClick={() =>
                      trackFacultyLink(track, 'type_page', 'courses_table')
                    }
                  >
                    {t(`faculty_hub.compare_link.${type}`)}
                  </ArrowLink>
                </div>
              )}
            </div>
          )
        })}
      </SectionShell>

      {data.apply && (
        <SectionShell
          id="candidaturas"
          title={t('faculty_admissions.hub.section_title')}
        >
          <ul className="divide-y divide-border">
            {data.apply.sections.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 py-2"
              >
                <Link
                  to={getFacultyAdmissionsPath(lang, facultySlug, s.id)}
                  onClick={() =>
                    trackFacultyLink(
                      track,
                      'admissions_page',
                      'admissions_section'
                    )
                  }
                  className="text-foreground hover:text-primaryBlue hover:underline"
                >
                  {applySectionLabel(t, s)}
                </Link>
                <span className="flex items-baseline gap-2 text-sm text-muted-foreground">
                  <StatusDot status={applyStatus(s.view).status} />
                  {applyStatusShort(t, lang, s.view) ??
                    t('faculty_admissions.status.guide_only')}
                </span>
              </li>
            ))}
          </ul>
          <ArrowLink
            to={getFacultyAdmissionsPath(lang, facultySlug)}
            onClick={() =>
              trackFacultyLink(track, 'admissions_page', 'admissions_section')
            }
          >
            {t('faculty_admissions.hub.section_link')}
          </ArrowLink>
        </SectionShell>
      )}

      {data.campuses.length > 0 && (
        <CampusesSection
          campuses={data.campuses}
          facultyWebsite={faculty.url}
          track={track}
        />
      )}

      {faq.length > 0 && <FaqSection items={faq} surface="faculty_page" />}

      {related.length > 0 && (
        <FacultyRelatedSection links={related} track={track} />
      )}
    </FacultyPageShell>
  )
}

/** "3 anos" (or "1 semestre" when it isn't whole years), ECTS underneath */
function DurationCell({ degree }: { degree: FacultyDegree }) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const semesters = degree.durationSemesters
  if (!semesters && !degree.ects) return <NoData />
  return (
    <span className="whitespace-nowrap">
      {semesters ? (
        semesters % 2 === 0 ? (
          t('degree_page.facts.years', {
            count: semesters / 2,
            n: formatNumber(semesters / 2, lang)
          })
        ) : (
          t('degree_page.facts.semesters', {
            count: semesters,
            n: formatNumber(semesters, lang)
          })
        )
      ) : (
        <NoData />
      )}
      {degree.ects && (
        <span className="block text-xs text-muted-foreground">
          {t('degree_page.facts.ects', { n: formatNumber(degree.ects, lang) })}
        </span>
      )}
    </span>
  )
}
