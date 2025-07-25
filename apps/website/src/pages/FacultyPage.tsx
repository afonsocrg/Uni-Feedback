import {
  ADD_COURSE_FORM_URL,
  buildDegreeUrl,
  insensitiveMatch,
  STORAGE_KEYS
} from '@/utils'
import { HeroSection, SearchDegrees, SelectionCard } from '@components'
import { useFacultyDegrees, useUrlNavigation } from '@hooks'
import type { Degree } from '@services/meicFeedbackAPI'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { BookOpen, Loader2, MessageSquare } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function FacultyPage() {
  const navigate = useNavigate()
  const { faculty, isLoading, error } = useUrlNavigation()

  const { data: degrees, isLoading: degreesLoading } = useFacultyDegrees(
    faculty?.id ?? null
  )

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

  // Store selected faculty and clear selected degree
  useEffect(() => {
    if (faculty) {
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_FACULTY_ID,
        faculty.id.toString()
      )
      // Clear selected degree when visiting faculty page
      localStorage.removeItem(STORAGE_KEYS.SELECTED_DEGREE_ID)
    }
  }, [faculty])

  // Handle errors
  useEffect(() => {
    if (error === 'faculty-not-found') {
      navigate('/', { replace: true })
    }
  }, [error, navigate])

  const handleDegreeSelect = (degree: Degree) => {
    if (faculty) {
      navigate(buildDegreeUrl(faculty, degree))
    }
  }

  if (isLoading || degreesLoading) {
    return (
      <div>
        <HeroSection showBreadcrumb />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primaryBlue" />
            <p className="mt-4 text-gray-600">Loading degrees...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!faculty) {
    return null // Will redirect to home
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
                      onClick={() => handleDegreeSelect(degree)}
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
