import type { Faculty } from '@uni-feedback/db/schema'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import type { ViewMode } from '~/utils/analytics'
import { analytics } from '~/utils/analytics'
import { loadDegreeFilters, saveDegreeFilters } from '~/utils/filterStorage'
import { getDegreePath } from '~/utils/i18n-routes'
import { userPreferences } from '~/utils/userPreferences'
import { BrowsePageLayout, DegreeCardGrid, DegreeTable } from '.'
import { FilterChip } from './common/FilterChip'
import { FilterRow } from './common/FilterRow'
import { MissingItemNote } from './common/MissingItemNote'
import { SearchInput } from './common/SearchInput'
import { DEFAULT_VIEW_MODE, ViewModeToggle } from './common/ViewModeToggle'
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
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE)

  // Entry event of the browse funnel, and the denominator for this page's view
  // mode switch rate. Keyed on the faculty so navigating to another one counts
  // as a new view, and deliberately not on `viewMode`: this records the page as
  // *served*, so re-firing it on a toggle would double-count the view.
  useEffect(() => {
    if (!faculty.slug) return

    analytics.discovery.facultyPageViewed({
      facultySlug: faculty.slug,
      degreeCount: degrees.length,
      defaultViewMode: DEFAULT_VIEW_MODE
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
    return [...new Set(degrees?.map((degree) => degree.type))].sort()
  }, [degrees])

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
          if (selectedType === null) return true
          return degree.type === selectedType
        })
        .sort((a, b) => (b.feedbackCount ?? 0) - (a.feedbackCount ?? 0)) ?? []
    )
  }, [degrees, searchQuery, selectedType])

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
      lastVisitedPath:
        faculty.slug && degree.slug
          ? getDegreePath(lang, faculty.slug, degree.slug)
          : undefined
    })
  }

  return (
    <BrowsePageLayout
      title={t('faculty_page.title')}
      faculty={faculty}
      searchBar={
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('faculty_page.search_placeholder')}
        />
      }
      filterChips={
        // The row renders even with no degree types to filter by, because the
        // view toggle lives here and is always available.
        <FilterRow
          trailing={
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              surface="faculty_page"
            />
          }
          filters={
            availableTypes.length > 0 && (
              <FilterChip
                label={t('faculty_page.filter_label')}
                options={availableTypes.map((type) => ({
                  value: type,
                  label: type
                }))}
                selectedValue={selectedType}
                onValueChange={handleTypeChange}
                placeholder={t('faculty_page.filter_placeholder')}
              />
            )
          }
        />
      }
      actions={
        <MissingItemNote
          text={t('faculty_page.missing_degree')}
          linkLabel={t('faculty_page.request_link')}
          href={ADD_COURSE_FORM_URL}
        />
      }
    >
      {!degrees || degrees.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('faculty_page.no_degrees')}
        </div>
      ) : filteredDegrees.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('faculty_page.no_results')}
        </div>
      ) : viewMode === 'cards' ? (
        <DegreeCardGrid
          degrees={filteredDegrees}
          getHref={getDegreeUrl}
          onSelect={handleDegreeClick}
        />
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
