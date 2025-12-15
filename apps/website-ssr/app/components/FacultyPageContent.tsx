import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { useEffect, useMemo, useState } from 'react'
import { userPreferences } from '~/utils/userPreferences'
import { BrowsePageLayout, DegreeCard } from '.'
import { FilterChip } from './common/FilterChip'
import { SearchInput } from './common/SearchInput'

interface DegreeWithCounts extends Degree {
  courseCount: number
  feedbackCount: number
}

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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Read from localStorage after hydration (only if same faculty)
  useEffect(() => {
    try {
      const storedFaculty = localStorage.getItem('degree-filter-faculty')
      // Only load filter if it's for the current faculty
      if (storedFaculty === faculty.slug) {
        const stored = localStorage.getItem('degree-type-filter')
        if (stored) {
          setSelectedType(JSON.parse(stored))
        }
      }
    } catch (error) {
      console.warn('Failed to read degree type filter from localStorage:', error)
    }
  }, [faculty.slug])

  // Wrapper that persists to localStorage when filter changes
  const handleTypeChange = (newType: string | null) => {
    setSelectedType(newType)

    try {
      if (newType === null) {
        localStorage.removeItem('degree-type-filter')
      } else {
        localStorage.setItem('degree-type-filter', JSON.stringify(newType))
        localStorage.setItem('degree-filter-faculty', faculty.slug)
      }
    } catch (error) {
      console.warn('Failed to persist degree type filter:', error)
    }
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

  const getDegreeUrl = (degree: Degree) => {
    if (!degree.slug) {
      throw new Error('Degree slug is missing ' + JSON.stringify(degree))
    }
    return `/${faculty.slug}/${degree.slug}`
  }

  const handleDegreeClick = (degree: Degree) => {
    // Save to localStorage immediately when user clicks
    userPreferences.set({
      lastSelectedFacultySlug: faculty.slug,
      lastSelectedDegreeSlug: degree.slug,
      lastVisitedPath: `/${faculty.slug}/${degree.slug}`
    })
  }

  return (
    <BrowsePageLayout
      title="Select Your Degree"
      faculty={faculty}
      searchBar={
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search degrees..."
        />
      }
      filterChips={
        availableTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2 items-center">
            <FilterChip
              label="Degree Type"
              options={availableTypes.map((type) => ({
                value: type,
                label: type
              }))}
              selectedValue={selectedType}
              onValueChange={handleTypeChange}
              placeholder="All Degree Types"
            />
          </div>
        ) : undefined
      }
      actions={
        <WarningAlert
          message={
            <>
              Missing a degree?{' '}
              <Button
                variant="link"
                size="xs"
                asChild
                className="p-0 h-auto text-sm underline"
              >
                <a
                  href={ADD_COURSE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request it here
                </a>
              </Button>
            </>
          }
        />
      }
    >
      {!degrees || degrees.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No degrees found for this university.
        </div>
      ) : filteredDegrees.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No degrees found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredDegrees.map((degree) => (
            <DegreeCard
              key={degree.id}
              degree={degree}
              href={getDegreeUrl(degree)}
              onClick={() => handleDegreeClick(degree)}
            />
          ))}
        </div>
      )}
    </BrowsePageLayout>
  )
}
