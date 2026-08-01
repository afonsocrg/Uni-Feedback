import type { University } from '@uni-feedback/db/schema'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '~/hooks'
import { analytics } from '~/utils/analytics'
import {
  loadBrowseUniversityFilter,
  saveBrowseUniversityFilter
} from '~/utils/filterStorage'
import { BrowsePageLayout, FacultySelector } from '.'
import { FilterRow } from './common/FilterRow'
import { MissingItemNote } from './common/MissingItemNote'
import { SearchInput } from './common/SearchInput'
import { ToggleChip } from './common/ToggleChip'
import type { FacultyWithUniversity } from './FacultySelector'

function insensitiveMatch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase())
}

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

interface BrowsePageContentProps {
  faculties: FacultyWithUniversity[]
}

export function BrowsePageContent({ faculties }: BrowsePageContentProps) {
  const { t } = useTranslation('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUniversitySlug, setSelectedUniversitySlug] = useState<
    string | null
  >(null)

  // Only universities that actually have a faculty here get a chip, so a chip
  // can never filter the grid down to nothing. Ordered by how many faculties
  // they contribute, so the ones that cut the list most sit first.
  const universities = useMemo(() => {
    const counts = new Map<string, { university: University; count: number }>()
    for (const faculty of faculties) {
      const { university } = faculty
      if (!university) continue
      const entry = counts.get(university.slug)
      if (entry) entry.count += 1
      else counts.set(university.slug, { university, count: 1 })
    }
    return [...counts.values()]
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.university.name.localeCompare(b.university.name)
      )
      .map((entry) => entry.university)
  }, [faculties])

  // A single university means the chip row could only ever be a no-op.
  const showUniversityFilter = universities.length > 1
  const activeUniversitySlug = showUniversityFilter
    ? selectedUniversitySlug
    : null

  const filteredFaculties = useMemo(() => {
    return faculties
      .filter((faculty) => {
        if (activeUniversitySlug === null) return true
        return faculty.university?.slug === activeUniversitySlug
      })
      .filter((faculty) => {
        // The university is part of the haystack so "ulisboa" finds IST, which
        // shares no substring with it. Students search by the name on the
        // building as often as by the acronym we show on the card.
        const haystack = [
          faculty.name,
          faculty.shortName,
          faculty.university?.name,
          faculty.university?.shortName
        ]
          .filter(Boolean)
          .join(' ')
        return insensitiveMatch(haystack, searchQuery.trim())
      })
  }, [faculties, searchQuery, activeUniversitySlug])

  // Restore the last-picked university and fire the view event, in that order
  // and in one effect: the event carries what was restored, so the two cannot
  // be split without racing. localStorage is read here rather than in the
  // initial state so the first client render still matches the server's.
  //
  // Runs once per mount. `faculties` is loader data and stable for the life of
  // the page, so there is nothing to re-run for.
  const hasMountedRef = useRef(false)
  useEffect(() => {
    if (hasMountedRef.current) return
    hasMountedRef.current = true

    const restored = loadBrowseUniversityFilter(universities.map((u) => u.slug))
    if (restored) setSelectedUniversitySlug(restored)

    analytics.discovery.browsePageViewed({
      facultyCount: faculties.length,
      universityCount: universities.length,
      restoredUniversitySlug: restored
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fire the search event once the query settles. Resetting the ref on an empty
  // query lets the same term re-fire if it is searched again later.
  const debouncedSearch = useDebounce(searchQuery, 400)
  const lastTrackedSearchRef = useRef<string | null>(null)
  useEffect(() => {
    if (debouncedSearch.trim().length === 0) {
      lastTrackedSearchRef.current = null
      return
    }
    if (lastTrackedSearchRef.current === debouncedSearch) return

    lastTrackedSearchRef.current = debouncedSearch
    analytics.discovery.browseSearchPerformed({
      searchQuery: debouncedSearch,
      resultsCount: filteredFaculties.length
    })
  }, [debouncedSearch, filteredFaculties.length])

  const handleUniversityToggle = (slug: string) => {
    const next = selectedUniversitySlug === slug ? null : slug
    setSelectedUniversitySlug(next)
    saveBrowseUniversityFilter(next)

    // Counted here rather than off `filteredFaculties`, which still holds the
    // pre-toggle list on this render.
    const resultsCount = faculties.filter((faculty) => {
      if (next !== null && faculty.university?.slug !== next) return false
      return insensitiveMatch(
        `${faculty.name} ${faculty.shortName}`,
        searchQuery.trim()
      )
    }).length

    analytics.discovery.browseUniversityFilterApplied({
      universitySlug: next,
      resultsCount
    })
  }

  const handleFacultySelect = (
    faculty: FacultyWithUniversity,
    index: number
  ) => {
    if (!faculty.slug) return
    analytics.discovery.browseFacultySelected({
      facultySlug: faculty.slug,
      universitySlug: faculty.university?.slug ?? null,
      positionInList: index,
      hasSearchQuery: searchQuery.trim().length > 0,
      hasUniversityFilter: activeUniversitySlug !== null
    })
  }

  return (
    <BrowsePageLayout
      title={t('page.title')}
      searchBar={
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('page.search_placeholder')}
        />
      }
      filterChips={
        showUniversityFilter && (
          <FilterRow
            filters={universities.map((university) => (
              <ToggleChip
                key={university.slug}
                label={university.shortName}
                isActive={activeUniversitySlug === university.slug}
                onClick={() => handleUniversityToggle(university.slug)}
              />
            ))}
          />
        )
      }
      actions={
        // No `text`: this page's link copy is a whole sentence on its own.
        <MissingItemNote
          linkLabel={t('page.request_link')}
          href={ADD_COURSE_FORM_URL}
        />
      }
    >
      <FacultySelector
        faculties={filteredFaculties}
        onSelect={handleFacultySelect}
      />
    </BrowsePageLayout>
  )
}
