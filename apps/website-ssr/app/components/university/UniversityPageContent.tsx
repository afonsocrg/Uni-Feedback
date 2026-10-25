import { cn } from '@uni-feedback/ui'
import { ArrowRight, MapPin } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { FACULTY_TYPE_PAGES } from '~/utils/facultyTypePages'
import {
  getFacultyPath,
  getUniversityPath,
  getUniversitySubpagePath,
  getUniversityTypePath
} from '~/utils/i18n-routes'
import {
  campusAddress,
  CampusMap,
  type CampusMapItem
} from '../common/campusMap'
import { ContributeNote } from '../common/ContributeNote'
import { LocalizedText } from '../common/LocalizedText'
import { OfficialLinks } from '../common/OfficialLinks'
import { ReportErrorNote } from '../common/ReportErrorNote'
import { SchoolLogo } from '../common/SchoolLogo'
import {
  formatEur,
  formatGrade,
  formatInt,
  formatSchoolYear,
  type FaqItem
} from '../degree/content'
import { FaqSection, SectionShell } from '../degree/DegreeSections'
import { DegreeTocBar, DegreeTocSidebar } from '../degree/DegreeToc'
import { useScrollSpy, type TocSection } from '../degree/scrollSpy'
import {
  getTypePagePath,
  TrackedLink,
  TYPE_ORDER,
  UniversityCrumbs,
  useJoinList,
  useTypeCountLabel
} from './shared'
import type { UniversityFaculty, UniversityPageData } from './types'

type SectionId = 'sobre' | 'faculdades' | 'cursos' | 'faq' | 'relacionados'

/**
 * `/unis/:uniSlug`: the university's page, in the degree page v2's layout
 * (sections with a sticky table of contents). Rough first version
 * (prds/content_rich_pages.md, "University"): our reviewed intro
 * (`university_details`, in the page's language or else Portuguese), the
 * faculties beside the campus map, and links to the degree list pages.
 * Admission grades and fees live on those pages and on each degree's, not
 * here. There is no banner yet.
 */
export function UniversityPageContent({ data }: { data: UniversityPageData }) {
  const { t } = useTranslation(['university', 'browse'])
  const lang = useLang()
  const joinList = useJoinList()
  const { university, faculties } = data
  const slug = university.slug

  const withGrade = data.bachelors.filter((b) => b.grade !== null)
  const typeCounts = FACULTY_TYPE_PAGES.filter((t) => data.degreeCounts[t])
  const campusItems: CampusMapItem[] = faculties.flatMap((faculty) =>
    faculty.campuses.map((campus) => ({
      key: `${faculty.slug}/${campus.id}`,
      title: `${faculty.shortName} · ${campus.name}`,
      pinLabel: faculty.shortName,
      address: campusAddress(campus),
      latitude: campus.latitude,
      longitude: campus.longitude,
      link: { to: getFacultyPath(lang, faculty.slug), label: faculty.name }
    }))
  )
  const topFaculty = [...faculties].sort(
    (a, b) => b.feedbackCount - a.feedbackCount
  )[0]

  const faq: FaqItem[] = useMemo(() => {
    const items: FaqItem[] = []
    if (faculties.length > 0) {
      items.push({
        topic: 'faculties',
        isMarkdown: false,
        question: t('page.faq.which_faculties_q', {
          shortName: university.shortName
        }),
        answer: t('page.faq.which_faculties_a', {
          faculties: joinList(faculties.map((f) => f.name))
        })
      })
    }
    const best = withGrade[0]
    if (best && data.admissionYear) {
      items.push({
        topic: 'admission_grade',
        isMarkdown: false,
        question: t('page.faq.highest_grade_q', {
          shortName: university.shortName
        }),
        answer: t('page.faq.highest_grade_a', {
          degree: best.name,
          faculty: best.facultyShortName,
          grade: formatGrade(best.grade!, lang),
          year: data.admissionYear
        })
      })
    }
    // Only when every licenciatura costs the same, which is the public norm
    const bachelorFees = faculties.flatMap((f) =>
      (f.fees.bachelor ?? []).filter((r) => r.period === 'year')
    )
    const amounts = new Set(bachelorFees.flatMap((r) => [r.min, r.max]))
    if (bachelorFees.length > 0 && amounts.size === 1 && data.feesSchoolYear) {
      items.push({
        topic: 'fees',
        isMarkdown: false,
        question: t('page.faq.fees_q', { shortName: university.shortName }),
        answer: t('page.faq.fees_a', {
          amount: formatEur(bachelorFees[0].min, lang),
          schoolYear: formatSchoolYear(data.feesSchoolYear)
        })
      })
    }
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lang])

  const tocSections: TocSection<SectionId>[] = [
    { id: 'faculdades', label: t('page.sections.faculties') },
    ...(data.degrees.length > 0
      ? [{ id: 'cursos' as const, label: t('page.sections.degrees') }]
      : []),
    ...(faq.length > 0
      ? [{ id: 'faq' as const, label: t('browse:degree_page.sections.faq') }]
      : []),
    { id: 'relacionados', label: t('page.sections.related') }
  ]
  const tocRef = useRef(tocSections)
  tocRef.current = tocSections

  const current = useScrollSpy(
    tocSections,
    { facultySlug: null, degreeSlug: null },
    (section) =>
      analytics.university.sectionViewed({ universitySlug: slug, section })
  )

  useEffect(() => {
    analytics.university.universityPageViewed({
      universitySlug: slug,
      page: 'main',
      facultyCount: faculties.length,
      sections: tocRef.current.map((s) => s.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const trackToc =
    (surface: 'sidebar' | 'mobile_sheet') => (section: SectionId) =>
      analytics.university.tocClicked({
        universitySlug: slug,
        section,
        surface
      })

  const degreesPath = getUniversitySubpagePath(lang, slug, 'degrees')
  const bachelorsPath = getUniversitySubpagePath(lang, slug, 'bachelors')
  const facultiesPath = getUniversitySubpagePath(lang, slug, 'faculties')
  const pageName = university.shortName

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-4">
        <UniversityCrumbs university={university} />
      </div>
      <DegreeTocBar
        sections={tocSections}
        current={current}
        onNavigate={trackToc('mobile_sheet')}
        onOpen={() => analytics.university.tocOpened({ universitySlug: slug })}
      />
      <div className="container mx-auto px-4 pb-16 pt-4 md:pt-6">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-12">
          <div className="min-w-0">
            <header className="mb-8">
              <div className="flex items-center gap-4">
                <SchoolLogo
                  logo={university.logo}
                  name={university.name}
                  shortName={university.shortName}
                  size="lg"
                />
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold leading-tight text-foreground text-balance md:text-3xl">
                    {university.name}
                  </h1>
                  <OfficialLinks
                    name={university.shortName}
                    links={data.links}
                    className="-ml-2 mt-1"
                    onClick={(kind) =>
                      analytics.university.linkClicked({
                        universitySlug: slug,
                        page: 'main',
                        target: kind,
                        surface: 'header'
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <TrackedLink
                  to={facultiesPath}
                  universitySlug={slug}
                  page="main"
                  target="faculties_page"
                  surface="header"
                  className="inline-flex h-10 items-center rounded-md bg-brand-solid px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t('page.cta.faculties', {
                    count: faculties.length,
                    n: faculties.length
                  })}
                </TrackedLink>
                {data.degrees.length > 0 && (
                  <TrackedLink
                    to={degreesPath}
                    universitySlug={slug}
                    page="main"
                    target="degrees_page"
                    surface="header"
                    className="inline-flex h-10 items-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    {t('page.cta.degrees', {
                      count: data.degrees.length,
                      n: formatInt(data.degrees.length, lang)
                    })}
                  </TrackedLink>
                )}
                {university.url && (
                  <a
                    href={university.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      analytics.university.linkClicked({
                        universitySlug: slug,
                        page: 'main',
                        target: 'official_site',
                        surface: 'header'
                      })
                    }
                    className="inline-flex h-10 items-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    {t('page.cta.official_site')}
                  </a>
                )}
              </div>
            </header>

            {data.intro && (
              <SectionShell id="sobre" first>
                <LocalizedText text={data.intro} />
              </SectionShell>
            )}

            <SectionShell
              id="faculdades"
              title={t('page.sections.faculties')}
              first={!data.intro}
            >
              <CampusMap
                items={campusItems}
                renderList={({ activeKey, select }) => (
                  <ul className="space-y-2">
                    {faculties.map((faculty) => (
                      <FacultyRow
                        key={faculty.id}
                        faculty={faculty}
                        universitySlug={slug}
                        campusItems={campusItems.filter(
                          (i) => i.key.split('/')[0] === faculty.slug
                        )}
                        activeKey={activeKey}
                        onSelect={select}
                      />
                    ))}
                  </ul>
                )}
                onSelect={(item, surface) =>
                  analytics.discovery.campusSelected({
                    page: 'university',
                    universitySlug: slug,
                    facultySlug: item.key.split('/')[0],
                    campus: item.title,
                    surface
                  })
                }
                onDirections={() =>
                  analytics.university.linkClicked({
                    universitySlug: slug,
                    page: 'main',
                    target: 'campus_map',
                    surface: 'faculties_section'
                  })
                }
              />
              {faculties.length > 1 && (
                <TrackedLink
                  to={facultiesPath}
                  universitySlug={slug}
                  page="main"
                  target="faculties_page"
                  surface="faculties_section"
                  className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primaryBlue hover:underline"
                >
                  {t('page.faculty_card.compare', {
                    shortName: university.shortName
                  })}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </TrackedLink>
              )}
              <ContributeNote
                field="campus"
                className="mt-4"
                text={t('page.about.more_schools', {
                  shortName: university.shortName
                })}
                pageName={pageName}
              />
            </SectionShell>

            {data.degrees.length > 0 && (
              <SectionShell id="cursos" title={t('page.sections.degrees')}>
                <p className="mb-3 max-w-prose text-foreground">
                  {t('page.degrees.intro', {
                    count: data.degrees.length,
                    n: formatInt(data.degrees.length, lang)
                  })}
                </p>
                <ul className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                  {typeCounts.map((type) => (
                    <li key={type}>
                      <TrackedLink
                        to={getUniversityTypePath(lang, slug, type)}
                        universitySlug={slug}
                        page="main"
                        target={
                          type === 'bachelor'
                            ? 'bachelors_page'
                            : 'university_type_page'
                        }
                        surface="degrees_section"
                        className="flex items-baseline justify-between gap-3 rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:border-primaryBlue"
                      >
                        <span className="font-semibold">
                          {t(`browse:degree_types.${type}`)}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatInt(data.degreeCounts[type]!, lang)}
                        </span>
                      </TrackedLink>
                    </li>
                  ))}
                </ul>
                <TrackedLink
                  to={degreesPath}
                  universitySlug={slug}
                  page="main"
                  target="degrees_page"
                  surface="degrees_section"
                  className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primaryBlue hover:underline"
                >
                  {t('page.degrees.see_all', {
                    count: data.degrees.length,
                    n: formatInt(data.degrees.length, lang)
                  })}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </TrackedLink>
              </SectionShell>
            )}

            {faq.length > 0 && (
              <FaqSection items={faq} surface="university_page" />
            )}

            <SectionShell id="relacionados" title={t('page.sections.related')}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {data.bachelors.length > 0 && (
                  <RelatedCard
                    to={bachelorsPath}
                    small={t('page.related.bachelors')}
                    title={t('page.related.bachelors_title', {
                      shortName: university.shortName
                    })}
                    slug={slug}
                    target="bachelors_page"
                  />
                )}
                {topFaculty && topFaculty.feedbackCount > 0 && (
                  <RelatedCard
                    to={getFacultyPath(lang, topFaculty.slug)}
                    small={t('page.related.top_faculty')}
                    title={topFaculty.name}
                    slug={slug}
                    target="faculty"
                  />
                )}
                {data.others.slice(0, 2).map((other) => (
                  <RelatedCard
                    key={other.slug}
                    to={getUniversityPath(lang, other.slug)}
                    small={t('page.related.other_university')}
                    title={other.name}
                    slug={slug}
                    target="university"
                  />
                ))}
              </div>
            </SectionShell>

            <div className="mt-12">
              <ReportErrorNote surface="university_page" pageName={pageName} />
            </div>
          </div>
          <aside className="hidden lg:block">
            <DegreeTocSidebar
              sections={tocSections}
              current={current}
              onNavigate={trackToc('sidebar')}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

function RelatedCard({
  to,
  small,
  title,
  slug,
  target
}: {
  to: string
  small: string
  title: string
  slug: string
  target: 'bachelors_page' | 'faculty' | 'university'
}) {
  return (
    <TrackedLink
      to={to}
      universitySlug={slug}
      page="main"
      target={target}
      surface="related"
      className="block rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:border-primaryBlue"
    >
      <span className="block text-xs text-muted-foreground">{small}</span>
      <span className="block font-semibold">{title}</span>
    </TrackedLink>
  )
}

/**
 * A faculty in the list beside the campus map: its name links to the faculty,
 * its degree counts to its type pages, and each campus is a button that
 * zooms the map there.
 */
function FacultyRow({
  faculty,
  universitySlug,
  campusItems,
  activeKey,
  onSelect
}: {
  faculty: UniversityFaculty
  universitySlug: string
  campusItems: CampusMapItem[]
  activeKey: string | null
  onSelect: (item: CampusMapItem) => void
}) {
  const { t } = useTranslation('university')
  const lang = useLang()
  const typeCount = useTypeCountLabel()
  const types = TYPE_ORDER.filter((type) => faculty.degreeCounts[type])
  return (
    <li className="flex gap-3 rounded-lg border border-border p-3">
      <SchoolLogo
        logo={faculty.logo}
        name={faculty.name}
        shortName={faculty.shortName}
        size="sm"
      />
      <div className="min-w-0">
        <TrackedLink
          to={getFacultyPath(lang, faculty.slug)}
          universitySlug={universitySlug}
          page="main"
          target="faculty"
          surface="faculty_list"
          className="font-semibold leading-snug text-foreground hover:underline"
        >
          {faculty.name}
        </TrackedLink>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {types.map((type, i) => {
            const label = typeCount(type, faculty.degreeCounts[type]!)
            const path = getTypePagePath(lang, faculty.slug, type)
            return (
              <span key={type}>
                {i > 0 && ' · '}
                {path ? (
                  <TrackedLink
                    to={path}
                    universitySlug={universitySlug}
                    page="main"
                    target="faculty_type_page"
                    surface="faculty_list"
                    className="hover:text-foreground hover:underline"
                  >
                    {label}
                  </TrackedLink>
                ) : (
                  label
                )}
              </span>
            )
          })}
        </p>
        <p className="text-sm text-muted-foreground">
          {faculty.feedbackCount > 0
            ? t('page.faculty_card.feedback', {
                count: faculty.feedbackCount,
                n: formatInt(faculty.feedbackCount, lang)
              })
            : t('page.faculty_card.no_feedback')}
        </p>
        {campusItems.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {campusItems.map((item) => {
              const pinned = item.latitude !== null && item.longitude !== null
              const selected = activeKey === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={!pinned}
                  aria-pressed={selected}
                  onClick={() => onSelect(item)}
                  title={item.address ?? undefined}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                    selected
                      ? 'border-primaryBlue bg-muted text-foreground'
                      : 'border-border text-muted-foreground',
                    pinned && 'hover:bg-muted hover:text-foreground'
                  )}
                >
                  <MapPin
                    aria-hidden="true"
                    className={cn(
                      'size-3',
                      pinned ? 'text-primaryBlue' : 'text-muted-foreground'
                    )}
                  />
                  {item.title.split(' · ').at(-1)}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </li>
  )
}
