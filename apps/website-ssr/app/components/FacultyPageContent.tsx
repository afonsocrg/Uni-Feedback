import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { BookOpen, MessageSquare } from 'lucide-react'
import { useMemo, useState } from 'react'
import { HeroSection, SelectionCard } from '.'

interface DegreeWithCounts extends Degree {
  courseCount: number
  feedbackCount: number
}

interface SearchDegreesProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  availableTypes: string[]
  selectedType: string | null
  setSelectedType: (type: string | null) => void
}

function SearchDegrees({
  searchQuery,
  setSearchQuery,
  availableTypes,
  selectedType,
  setSelectedType
}: SearchDegreesProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search degrees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="sm:w-48">
        <select
          value={selectedType || ''}
          onChange={(e) => setSelectedType(e.target.value || null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function insensitiveMatch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase())
}

const ADD_COURSE_FORM_URL = 'https://forms.gle/your-form-url' // TODO: Replace with actual URL

interface FacultyPageContentProps {
  faculty: Faculty
  degrees: DegreeWithCounts[]
}

export function FacultyPageContent({
  faculty,
  degrees
}: FacultyPageContentProps) {
  // const navigate = useNavigate()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Available degree types for filtering
  const availableTypes = useMemo(() => {
    return [...new Set(degrees?.map((degree) => degree.type))].sort()
  }, [degrees])

  // Filtered degrees based on search and type
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
          if (selectedType === null) {
            return true
          }
          return degree.type === selectedType
        })
        .sort((a, b) => (b.feedbackCount ?? 0) - (a.feedbackCount ?? 0)) ?? []
    )
  }, [degrees, searchQuery, selectedType])

  const getDegreeUrl = (degree: Degree) => {
    return `/${faculty.slug || faculty.shortName}/${degree.slug || degree.acronym}`
  }

  return (
    <div>
      <HeroSection showBreadcrumb />
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Select Your Degree
            </h1>
            <p className="text-gray-600">
              Choose your degree from {faculty.name}
            </p>
          </div>

          {!degrees || degrees.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No degrees found for this university.
            </div>
          ) : (
            <>
              <div className="mb-6">
                <SearchDegrees
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  availableTypes={availableTypes}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                />
              </div>
              {filteredDegrees.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No degrees found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredDegrees.map((degree) => (
                    <SelectionCard
                      key={degree.id}
                      title={degree.name}
                      subtitle={degree.acronym}
                      href={getDegreeUrl(degree)}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-auto">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{degree.courseCount ?? 0} courses</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{degree.feedbackCount ?? 0} feedback</span>
                        </div>
                      </div>
                    </SelectionCard>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-8">
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
          </div>
        </div>
      </div>
    </div>
  )
}
