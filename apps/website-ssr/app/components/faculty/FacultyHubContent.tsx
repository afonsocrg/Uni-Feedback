import type { DegreeType, Faculty } from '@uni-feedback/db/schema'
import { DEGREE_TYPES } from '@uni-feedback/db/schema'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { getFacultyTypePath, isFacultyTypePage } from '~/utils/facultyTypePages'
import { getUniversityPath } from '~/utils/i18n-routes'
import { LocalizedText } from '../common/LocalizedText'
import { OfficialLinks } from '../common/OfficialLinks'
import { SearchInput } from '../common/SearchInput'
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
 * The faculty hub (`/ist`), prds/content_rich_pages.md "Faculty": what the
 * faculty is, then the degree table (what students come for), one table per
 * type behind chips, each linking to its type page; then the courses students
 * talk about, campuses, FAQ and related links. Every section renders only with
 * data.
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
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

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
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t('faculty_page.search_placeholder')}
        />
        {types.length > 1 && !q && (
          <div className="mt-3 flex flex-wrap gap-1.5">
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
          const rows = degrees.filter(
            (d) =>
              d.type === type &&
              (!q || `${d.acronym} ${d.name}`.toLowerCase().includes(q))
          )
          const hidden = q ? rows.length === 0 : type !== activeType
          return (
            <div key={type} hidden={hidden} className="mt-3">
              {q && (
                <h3 className="mb-1 mt-4 text-sm font-semibold text-muted-foreground">
                  {t(`degree_types.${type}`)}
                </h3>
              )}
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
                    />,
                    d.campuses.length > 0 ? d.campuses.join(', ') : <NoData />,
                    formatInt(d.courseCount, lang),
                    formatInt(d.feedbackCount, lang)
                  ]
                }))}
              />
              {!q && isFacultyTypePage(type) && (
                <ArrowLink
                  to={getFacultyTypePath(lang, facultySlug, type)}
                  onClick={() =>
                    trackFacultyLink(track, 'type_page', 'courses_table')
                  }
                >
                  {t(`faculty_hub.compare_link.${type}`)}
                </ArrowLink>
              )}
            </div>
          )
        })}
        {q &&
          !degrees.some((d) =>
            `${d.acronym} ${d.name}`.toLowerCase().includes(q)
          ) && (
            <p className="py-6 text-center text-muted-foreground">
              {t('faculty_page.no_results')}
            </p>
          )}
      </SectionShell>

      {data.campuses.length > 0 && (
        <CampusesSection
          campuses={data.campuses}
          facultyUrl={faculty.url}
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
