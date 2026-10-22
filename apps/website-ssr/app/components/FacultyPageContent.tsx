import {
  DEGREE_TYPES,
  type DegreeType,
  type Faculty
} from '@uni-feedback/db/schema'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { loadDegreeFilters, saveDegreeFilters } from '~/utils/filterStorage'
import { getDegreeCoursesPath, getDegreePath } from '~/utils/i18n-routes'
import { userPreferences } from '~/utils/userPreferences'
import { BrowsePageLayout, DegreeTable } from '.'
import { AskChatButton } from './chat/AskChatButton'
import { FilterChip } from './common/FilterChip'
import { FilterRow } from './common/FilterRow'
import { MissingItemNote } from './common/MissingItemNote'
import { ReportErrorNote } from './common/ReportErrorNote'
import { SearchInput } from './common/SearchInput'
import type { DegreeWithCounts } from './degree/types'

function insensitiveMatch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase())
}

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

interface FacultyPageContentProps {
  faculty: Faculty
  degrees: DegreeWithCounts[]
}

export function FacultyPageContent({
  faculty,
  degrees
}: FacultyPageContentProps) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Entry event of the browse funnel. Keyed on the faculty so navigating to
  // another one counts as a new view.
  useEffect(() => {
    if (!faculty.slug) return

    analytics.discovery.facultyPageViewed({
      facultySlug: faculty.slug,
      degreeCount: degrees.length
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faculty.slug])

  // Read from localStorage after hydration (only if same faculty)
  useEffect(() => {
    if (!faculty.slug) return
    const savedFilters = loadDegreeFilters(faculty.slug)
    if (savedFilters) {
      setSelectedType(savedFilters.degreeType)
    }
  }, [faculty.slug])

  // Wrapper that persists to localStorage when filter changes
  const handleTypeChange = (newType: string | null) => {
    setSelectedType(newType)
    if (faculty.slug) saveDegreeFilters(faculty.slug, { degreeType: newType })
  }

  const availableTypes = useMemo(() => {
    const present = new Set<DegreeType>(degrees?.map((degree) => degree.type))
    return DEGREE_TYPES.filter((type) => present.has(type))
  }, [degrees])

  // A faculty whose degrees are all one type gets no type chip: it could only
  // be a no-op. Counted over every degree, not `filteredDegrees`, so the chip
  // doesn't vanish as the search narrows the list.
  const showTypeFilter = availableTypes.length > 1

  // A saved selection can be stale: saved before this faculty's degrees
  // narrowed to a single type (the chip is gone), or a type spelling from
  // before degree types were normalised. Filtering on it would empty the page
  // with nothing selected in the chip to undo it.
  const activeType =
    showTypeFilter && availableTypes.some((type) => type === selectedType)
      ? selectedType
      : null

  const filteredDegrees = useMemo(() => {
    return (
      degrees
        ?.filter((degree) => {
          return insensitiveMatch(
            `${degree.name} ${degree.acronym}`,
            searchQuery
          )
        })
        .filter((degree) => {
          if (activeType === null) return true
          return degree.type === activeType
        })
        .sort((a, b) => (b.feedbackCount ?? 0) - (a.feedbackCount ?? 0)) ?? []
    )
  }, [degrees, searchQuery, activeType])

  const getDegreeUrl = (degree: DegreeWithCounts) => {
    if (!faculty.slug) {
      throw new Error('Faculty slug is missing ' + JSON.stringify(faculty))
    }
    if (!degree.slug) {
      throw new Error('Degree slug is missing ' + JSON.stringify(degree))
    }
    return getDegreePath(lang, faculty.slug, degree.slug)
  }

  const handleDegreeClick = (degree: DegreeWithCounts) => {
    userPreferences.set({
      lastSelectedFacultySlug: faculty.slug ?? undefined,
      lastSelectedDegreeSlug: degree.slug ?? undefined,
      // The link opens the degree page; a returning student comes back to
      // its course browser
      lastVisitedPath:
        faculty.slug && degree.slug
          ? getDegreeCoursesPath(lang, faculty.slug, degree.slug)
          : undefined
    })
  }

  return (
    <BrowsePageLayout
      title={t('faculty_page.title', { name: faculty.name })}
      faculty={faculty}
      searchBar={
        <SearchInput
          trailing={
            <AskChatButton
              name={faculty.shortName}
              facultyId={faculty.id}
              source="faculty_page"
              variant="ghost"
              size="sm"
              compact
              label={t('chat_prompt', { ns: 'chat' })}
            />
          }
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('faculty_page.search_placeholder')}
        />
      }
      filterChips={
        showTypeFilter && (
          <FilterRow
            filters={
              <FilterChip
                label={t('faculty_page.filter_label')}
                options={availableTypes.map((type) => ({
                  value: type,
                  label: t(`degree_types.${type}`)
                }))}
                selectedValue={activeType}
                onValueChange={handleTypeChange}
                placeholder={t('faculty_page.filter_placeholder')}
              />
            }
          />
        )
      }
      actions={
        <div className="space-y-2">
          <MissingItemNote
            text={t('faculty_page.missing_degree')}
            linkLabel={t('faculty_page.request_link')}
            href={ADD_COURSE_FORM_URL}
          />
          <ReportErrorNote
            surface="faculty_page"
            pageName={faculty.shortName}
            facultySlug={faculty.slug}
          />
        </div>
      }
    >
      {!degrees || degrees.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('faculty_page.no_degrees')}
        </div>
      ) : filteredDegrees.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
          {t('faculty_page.no_results')}
          <AskChatButton
            name={faculty.shortName}
            facultyId={faculty.id}
            source="faculty_page"
            variant="outline"
            size="sm"
            label={t('chat_no_results', { ns: 'chat' })}
          />
        </div>
      ) : (
        <DegreeTable
          degrees={filteredDegrees}
          getHref={getDegreeUrl}
          onSelect={handleDegreeClick}
        />
      )}
    </BrowsePageLayout>
  )
}
