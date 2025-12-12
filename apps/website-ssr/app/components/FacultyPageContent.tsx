import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { useMemo, useState } from 'react'
import { BrowsePageLayout, DegreeCard } from '.'
import { ClearFiltersChip } from './common/ClearFiltersChip'
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

  const handleClearFilters = () => {
    setSelectedType(null)
  }

  const activeFilterCount = selectedType ? 1 : 0

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
        <div className="flex flex-wrap gap-2 items-center">
          <FilterChip
            label="Degree Type"
            options={availableTypes.map((type) => ({
              value: type,
              label: type
            }))}
            selectedValue={selectedType}
            onValueChange={setSelectedType}
            placeholder="All Types"
          />
          <ClearFiltersChip
            onClick={handleClearFilters}
            visible={activeFilterCount > 0}
          />
        </div>
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
            />
          ))}
        </div>
      )}
    </BrowsePageLayout>
  )
}
