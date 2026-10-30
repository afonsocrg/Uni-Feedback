import type { DegreeType, Faculty } from '@uni-feedback/db/schema'
import { DEGREE_TYPES } from '@uni-feedback/db/schema'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { getFacultyTypePath, isFacultyTypePage } from '~/utils/facultyTypePages'
import { getUniversityPath } from '~/utils/i18n-routes'
import { LocalizedText } from '../common/LocalizedText'
import { OfficialLinks } from '../common/OfficialLinks'
import { ToggleChip } from '../common/ToggleChip'
import type { FaqItem } from '../degree/content'
import { formatGrade, formatInt } from '../degree/content'
import { FaqSection, SectionShell } from '../degree/DegreeSections'
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
import type { FacultyHubData } from './types'

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
    }))
  ]

  const sections = [
    { id: 'cursos', label: t('faculty_hub.sections.courses') },
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
    >
      {data.intro && (
        <SectionShell id="sobre" first>
          <LocalizedText text={data.intro} />
        </SectionShell>
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
                  t('faculty_hub.table.campus'),
                  t('faculty_page.column_courses'),
                  t('faculty_page.column_feedback')
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
                      nameFirst
                    />,
                    d.campuses.length > 0 ? d.campuses.join(', ') : <NoData />,
                    formatInt(d.courseCount, lang),
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

      {data.campuses.length > 0 && (
        <CampusesSection campuses={data.campuses} track={track} />
      )}

      {faq.length > 0 && <FaqSection items={faq} surface="faculty_page" />}

      {related.length > 0 && (
        <FacultyRelatedSection links={related} track={track} />
      )}
    </FacultyPageShell>
  )
}
