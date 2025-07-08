import { SearchDegrees, WarningAlert } from '@components'
import { useApp, useFacultyDegrees, useFacultyDetails } from '@hooks'
import { Button } from '@ui/button'
import { ADD_COURSE_FORM_URL, insensitiveMatch } from '@utils'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DegreeCard } from './DegreeCard'

export function DegreeSelectorInline() {
  const { selectedFacultyId, setSelectedDegreeId } = useApp()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: degrees, isLoading } = useFacultyDegrees(selectedFacultyId)
  const { data: facultyDetails } = useFacultyDetails(selectedFacultyId)

  const availableTypes = useMemo(() => {
    return [...new Set(degrees?.map((degree) => degree.type))].sort()
  }, [degrees])
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const handleDegreeSelect = (degreeId: number) => {
    setSelectedDegreeId(degreeId)
  }

  const filteredDegrees =
    degrees
      ?.filter((degree) => {
        return insensitiveMatch(`${degree.name} ${degree.acronym}`, searchQuery)
      })
      .filter((degree) => {
        if (selectedType === null) {
          return true
        }
        return degree.type === selectedType
      }) ?? []

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-istBlue" />
        <p className="mt-4 text-gray-600">Loading degrees...</p>
      </div>
    )
  }

  if (!facultyDetails) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Uni not found.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Select Your Degree
        </h1>
        <p className="text-gray-600">
          Choose your degree from {facultyDetails.name}
        </p>
      </div>

      <SearchDegrees
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        availableTypes={availableTypes}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />

      <div className="mt-8">
        {filteredDegrees.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No degrees found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredDegrees.map((degree) => (
              <DegreeCard
                key={degree.id}
                degree={degree}
                onClick={() => handleDegreeSelect(degree.id)}
                className="min-w-[320px]"
              />
            ))}
          </div>
        )}
      </div>

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
  )
}
