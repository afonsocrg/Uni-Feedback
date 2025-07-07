import { ADD_COURSE_FORM_URL, buildDegreeUrl, buildFacultyUrl } from '@/utils'
import { SelectionCard, WarningAlert, HeroSection } from '@components'
import { Button } from '@components/ui/button'
import { useUrlNavigation, useFacultyDegrees } from '@hooks'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import type { Degree } from '@services/meicFeedbackAPI'

export function FacultyPage() {
  const navigate = useNavigate()
  const { faculty, isLoading, error } = useUrlNavigation()
  
  const { data: degrees, isLoading: degreesLoading } = useFacultyDegrees(faculty?.id ?? null)

  // Store last visited path
  useEffect(() => {
    if (faculty) {
      localStorage.setItem('lastVisitedPath', buildFacultyUrl(faculty))
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {degrees.map((degree) => (
                <SelectionCard
                  key={degree.id}
                  title={degree.acronym}
                  subtitle={degree.name}
                  onClick={() => handleDegreeSelect(degree)}
                />
              ))}
            </div>
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